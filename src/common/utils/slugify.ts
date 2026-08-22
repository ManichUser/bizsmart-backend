/**
 * Transforme un nom en identifiant utilisable dans une URL/sous-domaine.
 * Ex: "Pâtisserie de l'Étoile !" -> "patisserie-de-l-etoile"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
