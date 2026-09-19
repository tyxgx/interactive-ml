"""Selenium UI regression tests for the Interactive ML frontend.

Run against production by default, or a local/preview build with BASE_URL=http://localhost:3000.
The heavy in-browser Python engine (Pyodide) is deliberately not exercised here: these tests only
cover what must work instantly (landing page, navigation, static dataset picker, layout).
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

TIMEOUT = 30


def wait(driver, timeout=TIMEOUT):
    return WebDriverWait(driver, timeout)


def test_landing_page_title_and_headline(driver, base_url):
    driver.get(base_url + "/")
    assert "Interactive ML" in driver.title
    h1 = wait(driver).until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
    assert "Watch a model learn" in h1.text


def test_open_the_app_button_navigates_to_explore(driver, base_url):
    driver.get(base_url + "/")
    cta = wait(driver).until(
        EC.element_to_be_clickable((By.XPATH, "//main//a[contains(., 'Open the app')]"))
    )
    cta.click()
    wait(driver).until(EC.url_contains("/explore"))
    assert driver.current_url.rstrip("/").endswith("/explore")


def test_explore_dataset_picker_lists_datasets(driver, base_url):
    driver.get(base_url + "/explore")
    select_el = wait(driver).until(EC.presence_of_element_located((By.ID, "dataset")))
    wait(driver).until(lambda d: len(Select(select_el).options) >= 2)
    assert len(Select(select_el).options) >= 2


def test_explore_sidebar_lists_algorithms(driver, base_url):
    driver.get(base_url + "/explore")
    wait(driver).until(EC.presence_of_element_located((By.ID, "dataset")))
    page_text = driver.find_element(By.TAG_NAME, "body").text
    for name in ("Logistic Regression", "Decision Tree", "Random Forest"):
        assert name in page_text, f"{name} missing from the algorithm list"


def test_landing_has_no_horizontal_overflow_on_mobile(mobile_driver, base_url):
    mobile_driver.get(base_url + "/")
    wait(mobile_driver).until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
    scroll_w = mobile_driver.execute_script("return document.documentElement.scrollWidth")
    inner_w = mobile_driver.execute_script("return window.innerWidth")
    assert scroll_w <= inner_w + 1, f"page scrolls sideways: {scroll_w}px > {inner_w}px"
