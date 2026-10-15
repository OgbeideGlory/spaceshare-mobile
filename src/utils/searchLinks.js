// The three main categories on the landing page, and which workspace `type` each one searches for.
// The values must match WORKSPACE_TYPES in constants.js.
// (The web also has searchLink(); on phones we use router.push({ pathname: '/search', params }).)
export const CATEGORY_TYPES = {
  work: 'workspace',
  meeting: 'meeting_room',
  creative: 'studio',
}
