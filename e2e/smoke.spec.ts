import { expect, test, type Page } from '@playwright/test'

async function login(page: Page): Promise<void> {
  await page.goto('/#/login')
  await page.getByLabel('E-mail').fill('demo@vuemind.dev')
  await page.getByLabel('Senha').fill('demo123')
  await page.getByRole('button', { name: 'Entrar na carteira' }).click()
  await expect(page.getByTestId('balance-card')).toBeVisible()
}

function nav(page: Page) {
  return page.getByLabel('Principal')
}

test.describe('Mind Wallet 2.0 smoke', () => {
  test('login, dashboard, extrato, favorecido, PIX, notificação e onboarding', async ({ page }) => {
    await login(page)

    await expect(page.getByTestId('daily-limit-bar')).toBeVisible()
    await expect(page.getByTestId('available-balance')).toContainText('R$')
    await expect(page.getByTestId('onboarding-checklist')).toBeVisible()
    await expect(page.getByTestId('onboarding-step-PROFILE_OK')).toHaveClass(/done/)

    await nav(page).getByRole('link', { name: 'Extrato' }).click()
    await page.getByTestId('transactions-search').fill('mercado')
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page.getByTestId('transactions-list')).toContainText('Mercado Central')
    await expect(page.getByTestId('transactions-list')).toContainText('Pagamento mercado')

    await nav(page).getByRole('link', { name: 'Início' }).click()
    await expect(page.getByTestId('onboarding-step-VIEW_STATEMENT')).toHaveClass(/done/)

    await nav(page).getByRole('link', { name: 'Favorecidos' }).click()
    await page.locator('#beneficiary-name').fill('E2E Favorecido')
    await page.getByTestId('beneficiary-type').selectOption('EMAIL')
    await page.locator('#beneficiary-pix').fill('e2e@vuemind.dev')
    await page.getByTestId('beneficiary-submit').click()
    await expect(page.getByTestId('beneficiary-list')).toContainText('E2E Favorecido')

    await nav(page).getByRole('link', { name: 'Início' }).click()
    await expect(page.getByTestId('onboarding-step-FIRST_BENEFICIARY')).toHaveClass(/done/)

    await nav(page).getByRole('link', { name: 'PIX', exact: true }).click()
    await page.getByTestId('pix-beneficiary').selectOption('b1')

    await page.getByTestId('pix-destination-continue').click()
    await page.locator('#pix-amount').fill('10,00')
    await page.getByTestId('pix-amount-continue').click()
    await page.getByTestId('pix-skip-schedule').click()
    await page.getByTestId('pix-confirm-submit').click()
    await expect(page.getByTestId('pix-receipt')).toBeVisible()
    await expect(page.getByTestId('pix-end-to-end')).not.toBeEmpty()

    await nav(page).getByRole('link', { name: 'Início' }).click()
    await expect(page.getByTestId('onboarding-step-FIRST_PIX')).toHaveClass(/done/)
    await expect(page.getByTestId('onboarding-progress')).toHaveText('4/4')

    await nav(page).getByRole('link', { name: 'Notificações' }).click()
    await expect(page.getByTestId('notifications-badge')).toBeVisible()
    await page.getByTestId('notification-mark-read').first().click()
    await page.getByTestId('notifications-read-all').click()
    await expect(page.getByTestId('notifications-badge')).toHaveCount(0)
  })
})
