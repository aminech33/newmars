import { test, expect } from '@playwright/test'

/**
 * Tests E2E - Navigation globale
 * Flow critique : Navigation entre les modules principaux
 */

test.describe('Global Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Navigation entre tous les modules principaux', async ({ page }) => {
    // 1. Hub (page d'accueil)
    await expect(page).toHaveURL(/.*\/(hub)?$/)
    await expect(page.locator('text=/hub|accueil|bienvenue/i').first()).toBeVisible()
    console.log('✅ Hub chargé')
    
    // 2. Tasks
    await page.click('text=Tâches')
    await expect(page).toHaveURL(/.*tasks/)
    await page.waitForTimeout(500)
    console.log('✅ Tasks chargé')
    
    // 3. Ma Journée
    await page.click('text=Ma Journée')
    await expect(page).toHaveURL(/.*myday/)
    await page.waitForTimeout(500)
    console.log('✅ Ma Journée chargé')
    
    // 4. Apprentissage
    await page.click('text=Apprentissage')
    await expect(page).toHaveURL(/.*learning/)
    await page.waitForTimeout(500)
    console.log('✅ Apprentissage chargé')
    
    // 5. Santé (si accessible directement)
    const healthLink = page.locator('text=Santé').first()
    if (await healthLink.isVisible()) {
      await healthLink.click()
      await expect(page).toHaveURL(/.*health/)
      await page.waitForTimeout(500)
      console.log('✅ Santé chargé')
    }
    
    // 6. Retour au Hub
    const hubLink = page.locator('text=/hub|accueil/i').first()
    if (await hubLink.isVisible()) {
      await hubLink.click()
      await expect(page).toHaveURL(/.*\/(hub)?$/)
      console.log('✅ Retour Hub')
    }
    
    console.log('✅ Test Navigation : Tous les modules - PASS')
  })

  test('Raccourcis clavier (si disponibles)', async ({ page }) => {
    // Tester quelques raccourcis clavier basiques
    await page.keyboard.press('Control+P') // Ouvrir palette de commandes
    await page.waitForTimeout(500)
    
    // Vérifier si une modal/palette s'est ouverte
    const modal = page.locator('[role="dialog"], .modal, .command-palette')
    if (await modal.isVisible()) {
      console.log('✅ Test Navigation : Raccourci Ctrl+P - PASS')
      await page.keyboard.press('Escape')
    } else {
      console.log('⚠️ Test Navigation : Raccourci Ctrl+P - SKIP')
    }
  })

  test('Recherche globale (si disponible)', async ({ page }) => {
    // Chercher un widget de recherche
    const searchButton = page.locator('button, input').filter({ hasText: /recherche|search/i }).first()
    if (await searchButton.isVisible()) {
      await searchButton.click()
      await page.waitForTimeout(500)
      
      // Vérifier qu'un input de recherche apparaît
      const searchInput = page.locator('input[type="search"], input[placeholder*="recherche"]')
      if (await searchInput.isVisible()) {
        console.log('✅ Test Navigation : Recherche globale - PASS')
      }
    } else {
      console.log('⚠️ Test Navigation : Recherche globale - SKIP')
    }
  })
})



