import SmartAccount from "./pages/SmartAccount";
import { SignIn } from "./components/SignIn";

function App() {
  return (
    <>
      <h1 className="text-3xl">Smart Spend Gift</h1>
      <SignIn />
      <SmartAccount />
    </>
  )
}

export default App;
