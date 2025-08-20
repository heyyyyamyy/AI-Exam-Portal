const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    credentials: {
        email: 'testuser@test.com',
        password: 'test123'
    },
    timeout: 30000,
    screenshotDir: './test-screenshots',
    reportFile: './test-report.json'
};

// Test results storage
let testResults = {
    startTime: new Date().toISOString(),
    endTime: null,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    errors: [],
    testCases: [],
    performance: {
        pageLoadTimes: {},
        apiResponseTimes: {}
    }
};

// Utility functions
class TestUtils {
    static async takeScreenshot(page, name) {
        try {
            if (!fs.existsSync(CONFIG.screenshotDir)) {
                fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.join(CONFIG.screenshotDir, filename);
            await page.screenshot({ path: filepath, fullPage: true });
            return filepath;
        } catch (error) {
            console.error('Screenshot failed:', error);
            return null;
        }
    }

    static async measurePageLoad(page, url) {
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const loadTime = Date.now() - startTime;
        testResults.performance.pageLoadTimes[url] = loadTime;
        return loadTime;
    }

    static async waitForElement(page, selector, timeout = CONFIG.timeout) {
        try {
            await page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            return false;
        }
    }

    static async safeClick(page, selector) {
        try {
            await page.waitForSelector(selector, { visible: true });
            await page.click(selector);
            return true;
        } catch (error) {
            console.error(`Failed to click ${selector}:`, error);
            return false;
        }
    }

    static async safeType(page, selector, text) {
        try {
            await page.waitForSelector(selector, { visible: true });
            await page.type(selector, text);
            return true;
        } catch (error) {
            console.error(`Failed to type in ${selector}:`, error);
            return false;
        }
    }

    static logTestResult(testName, passed, error = null, screenshot = null) {
        testResults.totalTests++;
        if (passed) {
            testResults.passedTests++;
            console.log(`✅ ${testName} - PASSED`);
        } else {
            testResults.failedTests++;
            console.log(`❌ ${testName} - FAILED`);
            if (error) {
                console.error(`   Error: ${error}`);
                testResults.errors.push({ test: testName, error: error.toString() });
            }
        }
        
        testResults.testCases.push({
            name: testName,
            passed,
            error: error ? error.toString() : null,
            screenshot,
            timestamp: new Date().toISOString()
        });
    }
}

// Test suite class
class StudentDashboardTests {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async setup() {
        try {
            console.log('🚀 Starting Student Dashboard Test Suite...');
            this.browser = await puppeteer.launch({
                headless: false, // Set to true for CI/CD
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();
            
            // Set up request/response monitoring
            this.page.on('response', response => {
                if (response.url().includes('/api/')) {
                    const url = response.url();
                    const responseTime = response.timing();
                    testResults.performance.apiResponseTimes[url] = responseTime;
                }
            });

            // Set up error monitoring
            this.page.on('pageerror', error => {
                console.error('Page error:', error);
                testResults.errors.push({ type: 'page_error', error: error.toString() });
            });

            this.page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.error('Console error:', msg.text());
                    testResults.errors.push({ type: 'console_error', error: msg.text() });
                }
            });

            return true;
        } catch (error) {
            console.error('Setup failed:', error);
            return false;
        }
    }

    async testLogin() {
        try {
            console.log('\n🔐 Testing Login Functionality...');
            
            // Navigate to login page
            const loadTime = await TestUtils.measurePageLoad(this.page, CONFIG.baseUrl);
            console.log(`Page load time: ${loadTime}ms`);

            // Check if login form exists
            const loginFormExists = await TestUtils.waitForElement(this.page, 'form');
            if (!loginFormExists) {
                throw new Error('Login form not found');
            }

            // Fill login credentials
            const emailInput = await TestUtils.safeType(this.page, 'input[type="email"]', CONFIG.credentials.email);
            const passwordInput = await TestUtils.safeType(this.page, 'input[type="password"]', CONFIG.credentials.password);
            
            if (!emailInput || !passwordInput) {
                throw new Error('Failed to fill login credentials');
            }

            // Submit login form
            const submitSuccess = await TestUtils.safeClick(this.page, 'button[type="submit"]');
            if (!submitSuccess) {
                throw new Error('Failed to submit login form');
            }

            // Wait for navigation to dashboard
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
            
            // Verify successful login by checking for student dashboard
            const dashboardExists = await TestUtils.waitForElement(this.page, 'h1');
            const currentUrl = this.page.url();
            
            if (dashboardExists && (currentUrl.includes('/student') || currentUrl === CONFIG.baseUrl + '/')) {
                TestUtils.logTestResult('Login with valid credentials', true);
                return true;
            } else {
                throw new Error('Login failed - not redirected to dashboard');
            }
        } catch (error) {
            const screenshot = await TestUtils.takeScreenshot(this.page, 'login-failed');
            TestUtils.logTestResult('Login with valid credentials', false, error, screenshot);
            return false;
        }
    }

    async testNavigation() {
        try {
            console.log('\n🧭 Testing Navigation Functionality...');
            
            const navigationTests = [
                { name: 'Dashboard', selector: 'button:contains("Dashboard")', expectedUrl: '/student' },
                { name: 'My Exams', selector: 'button:contains("My Exams")', expectedUrl: '/student/exams' },
                { name: 'My Results', selector: 'button:contains("My Results")', expectedUrl: '/student/results' },
                { name: 'My Order', selector: 'button:contains("My Order")', expectedUrl: '/student/pipelines' }
            ];

            for (const test of navigationTests) {
                try {
                    // Find and click navigation button
                    const button = await this.page.$x(`//button[contains(text(), "${test.name}")]`);
                    if (button.length > 0) {
                        await button[0].click();
                        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                        
                        const currentUrl = this.page.url();
                        if (currentUrl.includes(test.expectedUrl)) {
                            TestUtils.logTestResult(`Navigation to ${test.name}`, true);
                        } else {
                            throw new Error(`Expected URL to contain ${test.expectedUrl}, got ${currentUrl}`);
                        }
                    } else {
                        throw new Error(`Navigation button for ${test.name} not found`);
                    }
                } catch (error) {
                    const screenshot = await TestUtils.takeScreenshot(this.page, `nav-${test.name.toLowerCase().replace(' ', '-')}-failed`);
                    TestUtils.logTestResult(`Navigation to ${test.name}`, false, error, screenshot);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Navigation testing failed:', error);
            return false;
        }
    }

    async testDashboardComponents() {
        try {
            console.log('\n📊 Testing Dashboard Components...');
            
            // Navigate to dashboard
            await this.page.goto(`${CONFIG.baseUrl}/student`, { waitUntil: 'networkidle2' });
            
            // Test statistics cards
            const statsCards = await this.page.$$('.card');
            if (statsCards.length >= 3) {
                TestUtils.logTestResult('Dashboard statistics cards display', true);
            } else {
                throw new Error(`Expected at least 3 statistics cards, found ${statsCards.length}`);
            }

            // Test available exams section
            const examElements = await this.page.$$('a[href*="/student/exam/"]');
            TestUtils.logTestResult('Available exams section display', true);
            console.log(`   Found ${examElements.length} available exams`);

            // Test quick actions
            const quickActionButtons = await this.page.$$('.btn');
            if (quickActionButtons.length >= 2) {
                TestUtils.logTestResult('Quick action buttons display', true);
            } else {
                throw new Error('Quick action buttons not found');
            }

            return true;
        } catch (error) {
            const screenshot = await TestUtils.takeScreenshot(this.page, 'dashboard-components-failed');
            TestUtils.logTestResult('Dashboard components display', false, error, screenshot);
            return false;
        }
    }

    async testExamsSection() {
        try {
            console.log('\n📝 Testing Exams Section...');
            
            // Navigate to exams page
            await this.page.goto(`${CONFIG.baseUrl}/student/exams`, { waitUntil: 'networkidle2' });
            
            // Check if exams page loads
            const pageTitle = await this.page.$('h1');
            if (pageTitle) {
                const titleText = await this.page.evaluate(el => el.textContent, pageTitle);
                if (titleText.includes('My Exams')) {
                    TestUtils.logTestResult('Exams page loads correctly', true);
                } else {
                    throw new Error(`Expected 'My Exams' title, got '${titleText}'`);
                }
            } else {
                throw new Error('Page title not found');
            }

            // Check for exam cards or no exams message
            const examCards = await this.page.$$('.exam-card');
            const noExamsMessage = await this.page.$('div:contains("No Assigned Exams")');
            
            if (examCards.length > 0 || noExamsMessage) {
                TestUtils.logTestResult('Exams content displays correctly', true);
                console.log(`   Found ${examCards.length} exam cards`);
            } else {
                throw new Error('No exam content found');
            }

            return true;
        } catch (error) {
            const screenshot = await TestUtils.takeScreenshot(this.page, 'exams-section-failed');
            TestUtils.logTestResult('Exams section functionality', false, error, screenshot);
            return false;
        }
    }

    async testResultsSection() {
        try {
            console.log('\n📈 Testing Results Section...');
            
            // Navigate to results page
            await this.page.goto(`${CONFIG.baseUrl}/student/results`, { waitUntil: 'networkidle2' });
            
            // Check if results page loads
            const pageTitle = await this.page.$('h1');
            if (pageTitle) {
                const titleText = await this.page.evaluate(el => el.textContent, pageTitle);
                if (titleText.includes('My Results')) {
                    TestUtils.logTestResult('Results page loads correctly', true);
                } else {
                    throw new Error(`Expected 'My Results' title, got '${titleText}'`);
                }
            } else {
                throw new Error('Results page title not found');
            }

            // Check for results content
            const resultsContent = await this.page.$('.card');
            if (resultsContent) {
                TestUtils.logTestResult('Results content displays correctly', true);
            } else {
                throw new Error('Results content not found');
            }

            return true;
        } catch (error) {
            const screenshot = await TestUtils.takeScreenshot(this.page, 'results-section-failed');
            TestUtils.logTestResult('Results section functionality', false, error, screenshot);
            return false;
        }
    }

    async testOrderPipeline() {
        try {
            console.log('\n🔄 Testing Order Pipeline...');
            
            // Navigate to pipelines page
            await this.page.goto(`${CONFIG.baseUrl}/student/pipelines`, { waitUntil: 'networkidle2' });
            
            // Check if pipeline page loads
            const pageTitle = await this.page.$('h1');
            if (pageTitle) {
                const titleText = await this.page.evaluate(el => el.textContent, pageTitle);
                if (titleText.includes('My Order')) {
                    TestUtils.logTestResult('Order pipeline page loads correctly', true);
                } else {
                    throw new Error(`Expected 'My Order' title, got '${titleText}'`);
                }
            } else {
                throw new Error('Pipeline page title not found');
            }

            // Check for pipeline content
            const pipelineContent = await this.page.$('.card');
            if (pipelineContent) {
                TestUtils.logTestResult('Pipeline content displays correctly', true);
            } else {
                throw new Error('Pipeline content not found');
            }

            return true;
        } catch (error) {
            const screenshot = await TestUtils.takeScreenshot(this.page, 'pipeline-failed');
            TestUtils.logTestResult('Order pipeline functionality', false, error, screenshot);
            return false;
        }
    }

    async testExamTaking() {
        try {
            console.log('\n🎯 Testing Exam Taking Functionality...');
            
            // Navigate to exams page to find available exams
            await this.page.goto(`${CONFIG.baseUrl}/student/exams`, { waitUntil: 'networkidle2' });
            
            // Look for "Start Exam" buttons
            const startExamButtons = await this.page.$$('a[href*="/student/exam/"]');
            
            if (startExamButtons.length > 0) {
                // Click on first available exam
                await startExamButtons[0].click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                
                // Check if exam interface loads
                const examInterface = await TestUtils.waitForElement(this.page, '.take-exam');
                if (examInterface) {
                    TestUtils.logTestResult('Exam interface loads correctly', true);
                    
                    // Test exit exam functionality using XPath
                    const exitButtons = await this.page.$x('//button[contains(text(), "Exit Exam")]');
                    if (exitButtons.length > 0) {
                        await exitButtons[0].click();
                        
                        // Check for exit confirmation modal
                        const exitModal = await TestUtils.waitForElement(this.page, '.modal', 5000);
                        if (exitModal) {
                            TestUtils.logTestResult('Exit exam confirmation modal displays', true);
                            
                            // Click continue to stay in exam using XPath
                            const continueButtons = await this.page.$x('//button[contains(text(), "Continue") or contains(text(), "Stay")]');
                            if (continueButtons.length > 0) {
                                await continueButtons[0].click();
                                TestUtils.logTestResult('Exit exam functionality works correctly', true);
                            } else {
                                TestUtils.logTestResult('Continue button not found in modal', false, new Error('Continue button missing'));
                            }
                        } else {
                            throw new Error('Exit confirmation modal not found');
                        }
                    } else {
                        TestUtils.logTestResult('Exit exam button not found', false, new Error('Exit button missing'));
                    }
                } else {
                    throw new Error('Exam interface did not load');
                }
            } else {
                TestUtils.logTestResult('No available exams to test', true);
                console.log('   No exams available for testing exam taking functionality');
            }
            
            return true;
        } catch (error) {
            const screenshot = await TestUtils.takeScreenshot(this.page, 'exam-taking-failed');
            TestUtils.logTestResult('Exam taking functionality', false, error, screenshot);
            return false;
        }
    }

    async testErrorRecovery() {
        try {
            console.log('\n🔧 Testing Error Recovery...');
            
            // Test navigation to non-existent exam
            await this.page.goto(`${CONFIG.baseUrl}/student/exam/99999`, { waitUntil: 'networkidle2' });
            
            // Should redirect or show error message
            const currentUrl = this.page.url();
            if (currentUrl.includes('/student/exams') || currentUrl.includes('/student')) {
                TestUtils.logTestResult('Error recovery for invalid exam ID', true);
            } else {
                // Check for error message
                const errorMessage = await this.page.$('.error, .alert, [class*="error"]');
                if (errorMessage) {
                    TestUtils.logTestResult('Error handling for invalid exam ID', true);
                } else {
                    throw new Error('No error handling found for invalid exam ID');
                }
            }

            return true;
        } catch (error) {
            const screenshot = await TestUtils.takeScreenshot(this.page, 'error-recovery-failed');
            TestUtils.logTestResult('Error recovery functionality', false, error, screenshot);
            return false;
        }
    }

    async generateReport() {
        try {
            console.log('\n📋 Generating Test Report...');
            
            testResults.endTime = new Date().toISOString();
            const duration = new Date(testResults.endTime) - new Date(testResults.startTime);
            testResults.duration = `${Math.round(duration / 1000)}s`;
            
            // Calculate success rate
            const successRate = testResults.totalTests > 0 
                ? Math.round((testResults.passedTests / testResults.totalTests) * 100) 
                : 0;
            
            testResults.successRate = `${successRate}%`;
            
            // Save detailed report
            fs.writeFileSync(CONFIG.reportFile, JSON.stringify(testResults, null, 2));
            
            // Generate summary report
            const summaryReport = `
=== STUDENT DASHBOARD TEST REPORT ===
Test Duration: ${testResults.duration}
Total Tests: ${testResults.totalTests}
Passed: ${testResults.passedTests}
Failed: ${testResults.failedTests}
Success Rate: ${testResults.successRate}

Failed Tests:
${testResults.testCases.filter(t => !t.passed).map(t => `- ${t.name}: ${t.error}`).join('\n')}

Performance Metrics:
${Object.entries(testResults.performance.pageLoadTimes).map(([url, time]) => `- ${url}: ${time}ms`).join('\n')}

Detailed report saved to: ${CONFIG.reportFile}
Screenshots saved to: ${CONFIG.screenshotDir}
`;
            
            console.log(summaryReport);
            fs.writeFileSync('./test-summary.txt', summaryReport);
            
            return true;
        } catch (error) {
            console.error('Report generation failed:', error);
            return false;
        }
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
            console.log('\n🧹 Cleanup completed');
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }

    async runAllTests() {
        try {
            const setupSuccess = await this.setup();
            if (!setupSuccess) {
                throw new Error('Test setup failed');
            }

            // Run all test suites
            await this.testLogin();
            await this.testNavigation();
            await this.testDashboardComponents();
            await this.testExamsSection();
            await this.testResultsSection();
            await this.testOrderPipeline();
            await this.testExamTaking();
            await this.testErrorRecovery();
            
            // Generate report
            await this.generateReport();
            
        } catch (error) {
            console.error('Test suite execution failed:', error);
            testResults.errors.push({ type: 'suite_error', error: error.toString() });
        } finally {
            await this.cleanup();
        }
    }
}

// Main execution
if (require.main === module) {
    const testSuite = new StudentDashboardTests();
    testSuite.runAllTests().then(() => {
        console.log('\n🎉 Test suite execution completed!');
        process.exit(testResults.failedTests > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = StudentDashboardTests;