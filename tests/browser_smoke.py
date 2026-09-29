"""Optional browser smoke test. Requires Python Playwright and an installed Chromium/Chrome."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE_URL=os.environ.get('BASE_URL')

def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True, executable_path=os.environ.get('CHROME_PATH','/usr/bin/chromium'))
        page=browser.new_page(viewport={"width":1440,"height":1000})
        target=BASE_URL or ROOT.joinpath('preview.html').as_uri()
        errors=[]
        page.on('pageerror',lambda exc: errors.append(str(exc)))
        page.goto(target,wait_until='load')
        page.get_by_text('예약의 빈틈을 다시 매출로 연결하는 흐름').wait_for()
        page.get_by_role('button',name='일정 · 빈자리').click()
        page.get_by_text('일정 · 빈자리',exact=True).last.wait_for()
        page.get_by_role('button',name='대기자 · 회복').click()
        page.get_by_text('대기자 · 빈자리 회복').wait_for()
        assert not errors, errors
        print('browser smoke: PASS',target)
        browser.close()
if __name__=='__main__': run()
