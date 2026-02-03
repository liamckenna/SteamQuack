# SteamQuack
A remake of the Steam game recommendation platform and website, [steamquack.com](https://steamquack.com), originally created in 2024 by one of the members, Liam. SteamQuack aims to analyze a user's play habits from the popular PC gaming platform Steam and provide them with personalized recommendations for new games.
SteamQuack offers users full reign over parameter weights of the recommendation algorithm in an engaging way that brings both additional novelty and utility to the platform. Additionally, users are guided through the experience by a
mascot character, Ducktor Gamez, informing them about the service's features in a comedic and light-hearted fashion.

With all these elements defining the original website, our goal is to preserve the spirit and functionality of steamquack.com while improving on its significant shortcomings and expanding features in a way that further supports its
established purpose. Our first objective is to remake the core functionality of the website using modern web app services and technologies, then move from there to add/refine features.

Here is a list of ideas/potential objectives for the remake:



- updated backend
  - sale data (either "on sale" or sale count)
  - persistently updated db (actual database not just json file)
  - sign in through steam api
  - overhauling the recommendation algorithm
    - excluding certain games
    - weigh playtime
    - weigh certain tags
    - weigh personal rating
    - decrease tag weight with each successive reccomendation of said tag

- updated frontend
  - mobile support
  - redesigned UI
  - redo mascot character (3d?)
  - tag data visualizations (charts, etc)
  - horizontal game cards


# Members
## Front-end
- Liam McKenna 
- Daniel Rodriguez
## Back-end
- Dylan Zhao
- Vishwa Kalal

------------------------------------

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
