import { UniversalProvider } from '@walletconnect/universal-provider';
import { Web3Modal } from '@web3modal/standalone'
import { ethers } from 'ethers';
import { useEffect, useState } from 'react'

// 2. Configure web3Modal
//I commented the project Id here, this will prevent desktop wallets to show up on modal. (optional)
const web3Modal = new Web3Modal({ 
  // projectId: process.env.NEXT_PUBLIC_PROJECT_ID 
  standaloneChains: ["eip155:1", "eip155:137"]
})

web3Modal.setTheme({
  themeMode: "light",
  themeColor: "blackWhite",
  themeBackground: "gradient",
});

export default function HomePage() {

  const [childProvider, setChildProvider] = useState<any>()
  const [parentProvider, setParentProvider] = useState<any>()

  const [tokenName, setTokenName] = useState<string>()

  // 3. Initialize sign client
  async function onInitializeSignClient() {
    
    const provider = await UniversalProvider.init({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      metadata: {
        name: "Glitch Dapp",
        description: "Glitch Dapp",
        url: "mywebsite.com",
        icons: ["https://lh3.googleusercontent.com/ogw/AOh-ky0c2alK5GAwefGWkwQHVpcJR637KRzHSZx9dV31rg=s32-c-mo"],
      },
    }).catch( e=> console.log("initialization failed - reload dapp") );

    provider?.on("display_uri", async (uri: any) => {
      web3Modal?.openModal({ uri });
    });

    provider?.on("session_ping", (e: any) => {
      console.log("session_ping",e);
    });
    
    provider?.on("session_event", (e: any) => {
      console.log("session_event",e);
    });

    provider?.on("session_request", (event: any) => {
      // Handle session method requests, such as "eth_sign", "eth_sendTransaction", etc.
    
      console.log(event)
    });

    provider?.on("session_update", (e: any) => {
      console.log("session_update",e);
    });

    provider?.on("session_delete", () => {
      console.log("session ended");
    });
          
    
    setChildProvider(provider)

    if(provider?.session){
      const web3Provider = new ethers.providers.Web3Provider(provider);
      setParentProvider(web3Provider)
  
      const signer = web3Provider.getSigner()
      const address = await signer.getAddress()
      const chainId = await signer.getChainId()
       console.log(address, chainId)
    }

    console.log('loaded, done')
  }

  // 4. Initiate connection and pass pairing uri to the modal
  async function onOpenModal() {

    await childProvider?.connect({
      namespaces: {
        eip155: {
          methods: [
            "eth_sendTransaction",
            "eth_signTransaction",
            "eth_sign",
            "personal_sign",
            "eth_signTypedData",
          ],
          chains: ["eip155:1", "eip155:137"],
          events: ["chainChanged", "accountsChanged"],
          rpcMap: {
            1:'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
            137: 'https://rpc.ankr.com/polygon',
          },
        },
      },
    }).then((e: any)=> console.log(e)).catch((e: any)=> console.log(e))

    // choose chain id to trigger the function to
    childProvider?.setDefaultChain("eip155:137")

    web3Modal?.closeModal();
        
    //  Create Web3 Provider
    const web3Provider = new ethers.providers.Web3Provider(childProvider);
    setParentProvider(web3Provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()
    const chainId = await signer.getChainId()
     console.log(address, chainId)
    
  }

  useEffect(() => {
    onInitializeSignClient().catch((e: any)=> console.log(e))
  }, [])

  const disconnect = ()=>{
    childProvider?.disconnect()
    window.localStorage.clear()
  }

  const interact = async()=>{

    const contractAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

    const ERC20Abi = [
      "function name() view returns (string)",
      "function approve(address spender, uint256 amount)"
    ];

    const signer = parentProvider.getSigner()
    const erc20Contract = new ethers.Contract(contractAddress, ERC20Abi, signer)

    const name = await erc20Contract.name().catch((e: any)=> {
      if(e.code == 5000) console.log('user rejected transaction')
      console.error(e)
    })

    console.log(name)

    setTokenName(name)

  }

  return (
    <>
    <button onClick={onOpenModal}>Connect Wallet</button>
    <button onClick={disconnect}>Bye Wallet</button>
    {tokenName}
    <button onClick={interact}>{ tokenName ? tokenName : 'call contract :3' }</button>
    </>
  )
}