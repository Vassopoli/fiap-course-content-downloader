import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/session.json';

setup('authenticate', async ({ page }) => {
  await page.goto(process.env.FIAP_URL??"");
  await page.getByLabel('RM').fill(process.env.FIAP_USERNAME??"");
  await page.getByLabel('Senha').fill(process.env.FIAP_PASSWORD??"");
  await page.getByRole('button', { name: 'Conectar' }).click();

  await page.waitForURL(process.env.FIAP_URL + '/Aluno/Home');
  await expect(page.getByText('Seja bem-vindo ao Portal do Aluno.')).toBeVisible();

  await page.context().storageState({ path: authFile });
});