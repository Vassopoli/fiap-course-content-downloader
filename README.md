# Getting Started

1. Add the `.env` file at the root directory to be used by the node application, like this:
    ```properties
    FIAP_URL = https://www2.fiap.com.br
    FIAP_CLASS_NAME = CLASS_CODE
    FIAP_USERNAME = USER_CODE
    FIAP_PASSWORD = USER_PASS
    ```

2. Set the environment variable `AWS_FIAP_BUCKET`, to be used by the aws cli to sync S3

3. Download the course content from Fiap website
    ```bash
    npx playwright test
    ```

4. Sync those files with S3 bucket
    ```bash
    aws s3 sync fiap-course-content ${AWS_FIAP_BUCKET}/fiap-course-content
    ```