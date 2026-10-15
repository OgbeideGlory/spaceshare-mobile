import client from './client'

// Each favourite has a populated `workspace` object
export const getFavourites = () => client.get('/api/favourites').then((res) => res.data.data)

export const addFavourite = (workspaceId) =>
  client.post(`/api/favourites/${workspaceId}`).then((res) => res.data.data)

export const removeFavourite = (workspaceId) =>
  client.delete(`/api/favourites/${workspaceId}`).then((res) => res.data)
