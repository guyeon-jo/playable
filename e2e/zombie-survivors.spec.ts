import { test, expect } from '@playwright/test';

test.describe('Zombie Survivors', () => {
  test('/game 진입 시 캐릭터 선택 화면이 표시된다', async ({ page }) => {
    await page.goto('/game');
    await expect(page.getByText('ZOMBIE SURVIVORS')).toBeVisible();
    await expect(page.getByText('총잡이')).toBeVisible();
    await expect(page.getByText('검사')).toBeVisible();
  });

  test('총잡이 선택 후 HUD에 "5:00" 타이머가 표시된다', async ({ page }) => {
    await page.goto('/game');
    await page.getByText('선택').first().click();
    await expect(page.getByText('5:00')).toBeVisible({ timeout: 3000 });
  });

  test('게임 시작 시 HP 바, EXP 바, 스킬 목록이 표시된다', async ({ page }) => {
    await page.goto('/game');
    await page.getByText('선택').first().click();
    await expect(page.getByText('LV.1')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('canvas')).toBeVisible();
  });
});
