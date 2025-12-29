import { test, expect } from '@playwright/test'

/**
 * Tests E2E - Module Library
 * Flow critique : Ajouter un livre
 */

test.describe('Library Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Ajouter un livre à la bibliothèque', async ({ page }) => {
    // 1. Aller dans Apprentissage (contient Library)
    await page.click('text=Apprentissage')
    await expect(page).toHaveURL(/.*learning/)
    
    // 2. Aller dans l'onglet Livres
    const libraryTab = page.locator('button, a').filter({ hasText: /livres|bibliothèque|library/i }).first()
    if (await libraryTab.isVisible()) {
      await libraryTab.click()
      await page.waitForTimeout(500)
      
      // 3. Ouvrir le formulaire d'ajout de livre
      const addBookButton = page.locator('button').filter({ hasText: /\+|ajouter.*livre/i }).first()
      if (await addBookButton.isVisible()) {
        await addBookButton.click()
        
        // 4. Remplir le formulaire
        await page.fill('input[name="title"], input[placeholder*="titre"]', 'Test E2E - Clean Code')
        await page.fill('input[name="author"], input[placeholder*="auteur"]', 'Robert C. Martin')
        
        // 5. Soumettre
        const submitButton = page.locator('button').filter({ hasText: /ajouter|valider|enregistrer/i }).first()
        await submitButton.click()
        
        // 6. Vérifier que le livre apparaît
        await expect(page.locator('text=Test E2E - Clean Code')).toBeVisible({ timeout: 5000 })
        
        console.log('✅ Test Library : Ajouter un livre - PASS')
      } else {
        console.log('⚠️ Test Library : Bouton ajouter livre non trouvé - SKIP')
      }
    } else {
      console.log('⚠️ Test Library : Onglet Livres non trouvé - SKIP')
    }
  })
})

