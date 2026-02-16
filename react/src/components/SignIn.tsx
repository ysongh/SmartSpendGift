import { useConnect, useConnectors } from 'wagmi'
 
export function SignIn() {
  const connect = useConnect()
  const [connector] = useConnectors()
 
  return (
    <div>
      <button
        onClick={() =>
          connect.connect({
            connector,
            capabilities: { type: 'sign-up' },
          })
        }
      >
        Sign up
      </button>
 
      <button onClick={() => connect.connect({ connector })}>
        Sign in
      </button>
    </div>
  )
}