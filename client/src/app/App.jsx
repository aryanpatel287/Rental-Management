import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './app.routes.jsx';
import './index.scss'

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
