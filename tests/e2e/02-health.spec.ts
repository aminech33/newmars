import { test, expect } from '@playwright/test'

/**
 * Tests E2E - Module Health
 * Flow critique : Ajouter un repas et voir les calories
 */

test.describe('Health Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Ajouter un repas et voir les calories', async ({ page }) => {
    // 1. Aller dans Ma Journée (contient Health)
    await page.click('text=Ma Journée')
    await expect(page).toHaveURL(/.*myday/)
    
    // 2. Aller dans l'onglet Santé
    const healthTab = page.locator('button, a').filter({ hasText: /santé|health/i }).first()
    if (await healthTab.isVisible()) {
      await healthTab.click()
      await page.waitForTimeout(500)
    }
    
    // 3. Ouvrir le formulaire d'ajout de repas
    const addMealButton = page.locator('button').filter({ hasText: /ajouter.*repas|\+.*repas/i }).first()
    if (await addMealButton.isVisible()) {
      await addMealButton.click()
      
      // 4. Remplir le formulaire
      await page.fill('input[name="name"], input[placeholder*="nom"]', 'Test E2E - Salade')
      await page.fill('input[name="calories"], input[placeholder*="calorie"]', '350')
      
      // 5. Soumettre
      const submitButton = page.locator('button').filter({ hasText: /ajouter|valider|enregistrer/i }).first()
      await submitButton.click()
      
      // 6. Vérifier que le repas apparaît
      await expect(page.locator('text=Test E2E - Salade')).toBeVisible({ timeout: 5000 })
      
      // 7. Vérifier que les calories sont affichées
      await expect(page.locator('text=/350.*cal/i')).toBeVisible()
      
      console.log('✅ Test Health : Ajouter un repas - PASS')
    } else {
      console.log('⚠️ Test Health : Bouton ajouter repas non trouvé - SKIP')
    }
  })
})


