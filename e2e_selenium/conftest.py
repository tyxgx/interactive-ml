import os

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

BASE_URL = os.environ.get("BASE_URL", "https://interactive-ml-kappa.vercel.app").rstrip("/")


def _make_driver(width: int, height: int):
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument(f"--window-size={width},{height}")
    driver = webdriver.Chrome(options=opts)
    driver.implicitly_wait(0)
    return driver


@pytest.fixture
def base_url():
    return BASE_URL


@pytest.fixture
def driver():
    d = _make_driver(1440, 900)
    yield d
    d.quit()


@pytest.fixture
def mobile_driver():
    d = _make_driver(390, 844)
    yield d
    d.quit()
