import { RouterProvider } from 'react-router-dom'
import router from './router'
import Toaster from './components/ui/Toaster'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App
