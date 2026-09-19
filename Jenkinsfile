pipeline {
  agent any
  options { timestamps(); timeout(time: 15, unit: 'MINUTES') }
  environment { BASE_URL = 'https://interactive-ml-kappa.vercel.app' }
  stages {
    stage('Set up') {
      steps {
        sh 'python3 -m venv .venv && . .venv/bin/activate && pip install -q -r e2e_selenium/requirements.txt'
      }
    }
    stage('Selenium UI tests') {
      steps {
        sh '. .venv/bin/activate && pytest e2e_selenium -v --junitxml=selenium-report.xml'
      }
    }
  }
  post {
    always { junit 'selenium-report.xml' }
  }
}
