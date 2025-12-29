/**
 * Encryption utilities for secure data storage
 * Uses AES-256 encryption via crypto-js
 */

import CryptoJS from 'crypto-js'

// Génération d'une clé unique par appareil (stockée une seule fois)
const getOrCreateEncryptionKey = (): string => {
  const KEY_STORAGE = 'newmars_encryption_key'
  
  let key = localStorage.getItem(KEY_STORAGE)
  
  if (!key) {
    // Générer une clé aléatoire sécurisée (256 bits)
    key = CryptoJS.lib.WordArray.random(32).toString()
    localStorage.setItem(KEY_STORAGE, key)
  }
  
  return key
}

const ENCRYPTION_KEY = getOrCreateEncryptionKey()

/**
 * Chiffre des données avec AES-256
 * @param data - Données à chiffrer (objet ou string)
 * @returns Données chiffrées (string)
 */
export function encrypt(data: any): string {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data)
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('❌ Erreur de chiffrement:', error)
    throw new Error('Échec du chiffrement des données')
  }
}

/**
 * Déchiffre des données AES-256
 * @param encryptedData - Données chiffrées
 * @param parseJSON - Si true, parse le résultat en JSON
 * @returns Données déchiffrées
 */
export function decrypt<T = any>(encryptedData: string, parseJSON = true): T {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!decryptedString) {
      throw new Error('Déchiffrement invalide')
    }
    
    return parseJSON ? JSON.parse(decryptedString) : decryptedString
  } catch (error) {
    console.error('❌ Erreur de déchiffrement:', error)
    throw new Error('Échec du déchiffrement des données')
  }
}

/**
 * Chiffre et sauvegarde dans localStorage
 * @param key - Clé de stockage
 * @param data - Données à sauvegarder
 */
export function encryptedSetItem(key: string, data: any): void {
  try {
    const encrypted = encrypt(data)
    localStorage.setItem(key, encrypted)
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde chiffrée de ${key}:`, error)
    // Fallback: sauvegarder en clair si le chiffrement échoue
    localStorage.setItem(key, JSON.stringify(data))
  }
}

/**
 * Récupère et déchiffre depuis localStorage
 * @param key - Clé de stockage
 * @returns Données déchiffrées ou null
 */
export function encryptedGetItem<T = any>(key: string): T | null {
  try {
    const encrypted = localStorage.getItem(key)
    
    if (!encrypted) {
      return null
    }
    
    // Tenter de déchiffrer
    try {
      return decrypt<T>(encrypted)
    } catch {
      // Si le déchiffrement échoue, essayer de parser en JSON (données non chiffrées)
      return JSON.parse(encrypted)
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de ${key}:`, error)
    return null
  }
}

/**
 * Supprime une clé de localStorage
 * @param key - Clé à supprimer
 */
export function encryptedRemoveItem(key: string): void {
  localStorage.removeItem(key)
}

/**
 * Hash une valeur (one-way, non réversible)
 * Utile pour les mots de passe ou identifiants
 * @param value - Valeur à hasher
 * @returns Hash SHA-256
 */
export function hash(value: string): string {
  return CryptoJS.SHA256(value).toString()
}

/**
 * Vérifie si le chiffrement est disponible
 * @returns true si le chiffrement fonctionne
 */
export function isEncryptionAvailable(): boolean {
  try {
    const testData = { test: 'encryption' }
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)
    return JSON.stringify(testData) === JSON.stringify(decrypted)
  } catch {
    return false
  }
}

/**
 * Réinitialise la clé de chiffrement (⚠️ DANGER: toutes les données chiffrées seront perdues)
 */
export function resetEncryptionKey(): void {
  localStorage.removeItem('newmars_encryption_key')
  console.warn('⚠️ Clé de chiffrement réinitialisée. Les données chiffrées existantes ne peuvent plus être déchiffrées.')
}

