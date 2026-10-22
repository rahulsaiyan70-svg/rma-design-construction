import os
from playwright.sync_api import sync_playwright

def run():
    os.makedirs('/home/jules/verification/screenshots', exist_ok=True)
    os.makedirs('/home/jules/verification/videos', exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 1200},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()

        page.goto('http://localhost:8000/index.html')
        page.wait_for_timeout(1000)

        # Trigger Pathseeker Portal V63 UI build
        page.evaluate('''() => {
            showPage('signin');
            var portal = document.getElementById('rmaPathSeekerPortal');
            if (portal) {
                portal.classList.remove('hidden');
                portal.style.display = 'block';
            }
            if (typeof window.showPathSeekerView === 'function') {
                window.showPathSeekerView('visit');
            }
        }''')
        page.wait_for_timeout(1000)

        # Take screenshot of portal site visits section
        page.screenshot(path='/home/jules/verification/screenshots/pathseekers_reports.png', full_page=False)
        page.wait_for_timeout(1000)

        context.close()
        browser.close()

if __name__ == '__main__':
    run()
