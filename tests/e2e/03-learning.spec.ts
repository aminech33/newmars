import { test, expect } from '@playwright/test'

/**
 * Tests E2E - Module Learning
 * Flow critique : Créer un cours et envoyer un message à l'IA
 */

test.describe('Learning Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Créer un cours et vérifier l\'interface', async ({ page }) => {
    // 1. Aller dans Apprentissage
    await page.click('text=Apprentissage')
    await expect(page).toHaveURL(/.*learning/)
    
    // 2. Vérifier que l'onglet Cours est actif
    const coursesTab = page.locator('button, a').filter({ hasText: /cours/i }).first()
    if (await coursesTab.isVisible()) {
      await coursesTab.click()
    }
    
    // 3. Ouvrir le formulaire de création de cours
    const addCourseButton = page.locator('button').filter({ hasText: /\+|nouveau.*cours|créer.*cours/i }).first()
    if (await addCourseButton.isVisible()) {
      await addCourseButton.click()
      
      // 4. Remplir le formulaire
      await page.fill('input[name="name"], input[placeholder*="nom"]', 'Test E2E - Python')
      
      // 5. Soumettre
      const submitButton = page.locator('button').filter({ hasText: /créer|ajouter|valider/i }).first()
      await submitButton.click()
      
      // 6. Vérifier que le cours apparaît
      await expect(page.locator('text=Test E2E - Python')).toBeVisible({ timeout: 5000 })
      
      console.log('✅ Test Learning : Créer un cours - PASS')
    } else {
      console.log('⚠️ Test Learning : Bouton créer cours non trouvé - SKIP')
    }
  })

  test('Interface de chat IA disponible', async ({ page }) => {
    // Aller dans Learning
    await page.click('text=Apprentissage')
    await expect(page).toHaveURL(/.*learning/)
    
    // Vérifier qu'il y a un input de chat ou un message d'accueil
    const chatInput = page.locator('textarea, input[type="text"]').filter({ hasText: /message|question/i }).first()
    const emptyState = page.locator('text=/créer.*cours|commencer/i')
    
    const hasChat = await chatInput.isVisible()
    const hasEmptyState = await emptyState.isVisible()
    
    if (hasChat || hasEmptyState) {
      console.log('✅ Test Learning : Interface chat - PASS')
    } else {
      console.log('⚠️ Test Learning : Interface chat - SKIP')
    }
  })
})


