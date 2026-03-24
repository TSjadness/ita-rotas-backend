# Sugestão de adaptação do frontend

## 1. AuthContext

Troque a validação fixa por chamada real ao backend.

```ts
const login = async (user: string, pass: string) => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, pass })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    return false;
  }

  localStorage.setItem('itarota79_auth', 'true');
  localStorage.setItem('itarota79_token', result.data.token);
  setIsAuthenticated(true);
  return true;
};
```

## 2. GalleryContext / RoutesContext / SponsorsContext / MembersContext

Substitua a leitura inicial do `localStorage` por `fetch` em `useEffect`.

## 3. Operações de criar/editar/excluir

- `addItem` -> `POST`
- `updateItem` -> `PUT`
- `deleteItem` -> `DELETE`

Sempre enviando o token salvo no login.
