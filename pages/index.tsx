import { UniversalProvider } from '@walletconnect/universal-provider';
import { Web3Modal } from '@web3modal/standalone'
import { ethers } from 'ethers';
import { useEffect, useState } from 'react'

// 2. Configure web3Modal
//I commented the project Id here, this will prevent desktop wallets to show up on modal. (optional)
const web3Modal = new Web3Modal({ 
  // projectId: process.env.NEXT_PUBLIC_PROJECT_ID 
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
    
    window.localStorage.clear()

    const provider = await UniversalProvider.init({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      metadata: {
        name: "Glitch Dapp",
        description: "Glitch Dapp",
        url: "mywebsite.com",
        icons: ["https://lh3.googleusercontent.com/ogw/AOh-ky0c2alK5GAwefGWkwQHVpcJR637KRzHSZx9dV31rg=s32-c-mo"],
      },
    });

    provider.on("display_uri", async (uri: any) => {
      web3Modal?.openModal({ uri });
    });

    provider.on("session_ping", (e: any) => {
      console.log("session_ping",e);
    });
    
    provider.on("session_event", (e: any) => {
      console.log("session_event",e);
    });

    provider.on("session_request", (event: any) => {
      // Handle session method requests, such as "eth_sign", "eth_sendTransaction", etc.
    
      console.log(event)
    });

    provider.on("session_update", (e: any) => {
      console.log("session_update",e);
    });

    provider.on("session_delete", () => {
      console.log("session ended");
    });
    
    setChildProvider(provider)

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
          chains: ["eip155:56"],
          events: ["chainChanged", "accountsChanged"],
          rpcMap: {
            56: 'https://bsc-dataseed1.binance.org/',
          },
        },
      },
    }).then((e: any)=> console.log(e)).catch((e: any)=> console.log(e))

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
  }

  const interact = async()=>{

    const contractAddress = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'

    const ERC20Abi = [
      "function name() view returns (string)",
      "function approve(address spender, uint256 amount)"
    ];

    const signer = parentProvider.getSigner()
    const erc20Contract = new ethers.Contract(contractAddress, ERC20Abi, signer)

    const name = await erc20Contract.name().catch((e: any)=> {
      if(e.code == 5000) console.log('user rejected transaction')
      console.log(e)
    })

    setTokenName(name)

  }

  return (
    <>
    <button onClick={onOpenModal}>Connect Wallet</button>
    <button onClick={disconnect}>Bye Wallet</button>
    <button onClick={interact}>{ tokenName ? tokenName : 'call contract :3' }</button>
    </>
  )
}