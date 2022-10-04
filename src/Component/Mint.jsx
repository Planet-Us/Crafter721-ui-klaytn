import react, {Component, useEffect, useRef,useState} from 'react';
import Caver from 'caver-js';
import axios from 'axios';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import ContractData from '../Constant/Contract';
import WLData from '../Constant/whiteList';

let nftAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const nftABI = ContractData.NFTABI;
let WLFlag = 0;
let limit = new Array();


export default function Mint(props) {
    const [account, setAccount] = useState("");
    const [blockNum, setBlockNum] = useState("");
    const [minterAddress, setMinterAddress] = useState("");
    const [mintCnt, setMintCnt] = useState(0);
    const [mintLive, setMintLive] = useState(true);
    const [walletConnection, setWalletConnection] = useState(false);
    const intervals = useRef();
    let caver = new Caver(window.klaytn);
    let contract = new caver.contract.create(nftABI, nftAddress);
    let NFTPrice = process.env.REACT_APP_NFT_PRICE.toString();
    let whiteList;
    const currentTimer = async () => {
      let blockTemp;

      if(caver){
        blockTemp = await caver.klay.getBlockNumber();
        setBlockNum(blockTemp.toString());
        if(blockTemp.toString() >= process.env.REACT_APP_START_BLOCK.toString()){
            setMintLive(false);
        }else{
            setMintLive(true);
        }
      }
    }
    
  const whiteListCheck = async (init) =>{
    if(process.env.REACT_APP_WHITELIST == "true"){
        whiteList = WLData.whiteList;
        let flag = 0;
        for(let i = 0; i<whiteList.length;i++){
          if(account.toUpperCase() == whiteList[i].toUpperCase()){
            flag = 1;
            WLFlag = 1;
            console.log(whiteList[i].toUpperCase());
          }
        }
        if(flag == 0){
          WLFlag = 0;
        }
    }
    let liveDate = process.env.REACT_APP_START_BLOCK;       
    const timeStmp = web3.eth.getBlockNumber();   
    if(timeStmp > liveDate){
      setMintLive(false);
    }
  }
    
  useEffect(() => {
    let ret;
    const addr = process.env.REACT_APP_TREASURY_ACCOUNT;

    async function getData(){

        const [address] = await window.klaytn.enable();      
        setWalletConnection(true);
        setAccount(address);
        setMinterAddress(addr);
        whiteListCheck(0);  
    }
    
    if(window.klaytn){
        getData();
      
      window.klaytn.on('accountsChanged', (accounts) => {
        setAccount(window.klaytn.selectedAddress);
        whiteListCheck(1);
      })    
    }else{
      alert("현재 사용할 수 있는 클레이튼 지갑이 없습니다. 지갑을 설치하신 후 이용바랍니다.");
    }
    intervals.current = setInterval(currentTimer, 500);
    return () => {
      clearInterval(intervals.current);
    }
  },[]); 
  
  useEffect(() => {  
    async function initMintCnt() {
        let mintCount = await contract.methods.totalSupply().call();
        whiteListCheck(0);
        setMintCnt(mintCount);
    }  
    if(account.length > 0){
        initMintCnt();
    }
  },[minterAddress]);
  useEffect(() => {    
    async function initMintCnt() {
        let mintCount = await contract.methods.totalSupply().call();
        whiteListCheck(1);
        setMintCnt(mintCount);
    }  
    if(account.length > 0 && minterAddress.length > 0){
        initMintCnt();
    }
  },[walletConnection]);

  const wait = async (ms) => {
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve();
      }, ms);
  });
  }
  const connectWallet = async () => {
    if(!window.klaytn._kaikas.isEnabled()){
      const [address] = await window.klaytn.enable();
      setAccount(address);
      setWalletConnection(true);
    }
  }

  const mintNFT = async (cnt) => {
    let ret;    
    whiteListCheck(1);
    let gaslimit = cnt * 850000;
    let mintCount = await contract.methods.totalSupply().call();
    
    if((parseInt(mintCount) + parseInt(cnt)) > process.env.REACT_APP_NUMBER_OF_NFT){    
      alert("최대발행갯수보다 많은 수의 발행을 시도하였습니다.")  ;
      throw new Error(
        'Mint number is more than max count. 최대발행갯수보다 많은 수의 발행을 시도하였습니다.',
      );
    }
    if(process.env.REACT_APP_WHITELIST == "true" && WLFlag != 1){
      alert("해당 주소는 민팅 대상 화이트리스트에 포함되어있지 않습니다.");
    }else {
      if(process.env.REACT_APP_WHITELIST == "true"){   
          ret = await caver.klay.sendTransaction({
              type: 'SMART_CONTRACT_EXECUTION',
              from: account,
              to: nftAddress,
              value: caver.utils.toPeb((NFTPrice * cnt).toString(), 'KLAY'),
              data: contract.methods.mintMultiple(account,cnt).encodeABI(),
              gas: gaslimit
            }).then(async (res)=>{
              console.log(res);
            })
            .catch((err) => {alert("Mint has failed.");});    
      }else{
        ret = await caver.klay.sendTransaction({
            type: 'SMART_CONTRACT_EXECUTION',
            from: account,
            to: nftAddress,
            value: caver.utils.toPeb((NFTPrice * cnt).toString(), 'KLAY'),
            data: contract.methods.mintMultiple(account,cnt).encodeABI(),
            gas: gaslimit
          }).then((res)=>{console.log(res);})
          .catch((err) => {alert("Mint has failed.");});
      }
        mintCount = await contract.methods.totalSupply().call();
        setMintCnt(mintCount);
      
        await wait(3000);
    }
    
  }
  
const bull = (
  <Box
    component="div"
    sx={{ display: 'flex', mx: '2px', md: '10px', transform: 'scale(0.8)' , border: '2px', alignContent: 'center', padding: '10px'}}
  >
  </Box>
);
    
  return (
    <div style={{display: 'flex', marginTop: '10%',justifyContent: 'center'}}>
      <Box  sx={{ width: '20%', background: '#000010', color: '#FFFFFF', borderRadius:'8px', minWidth:'270px'}}>
      <Stack spacing={1}>
        <h3 style={{color:"white"}}>Block Number : {blockNum}<br/> Start Number : {process.env.REACT_APP_START_BLOCK}</h3>
        <div>Remaining {mintCnt}/{process.env.REACT_APP_NUMBER_OF_NFT}</div>
        <div>Price : {process.env.REACT_APP_NFT_PRICE} Klay</div>
        <Button variant="contained" style={{margin:'5px', background: '#4f473e', color: 'white'}} disabled={walletConnection} onClick={connectWallet}>{walletConnection ? (account.toString().slice(0,7) + "...") : "Wallet Connect"}</Button>
        <Button variant="contained" style={{margin:'5px'}} disabled={mintLive} onClick={(cnt) => mintNFT(1)}>Mint 1 NFT</Button>
        <Button variant="contained" style={{margin:'5px'}} disabled={mintLive} onClick={(cnt) => mintNFT(3)}>Mint 3 NFT</Button>
        <Button variant="contained" style={{margin:'5px'}} disabled={mintLive} onClick={(cnt) => mintNFT(5)}>Mint 5 NFT</Button>
        <div style={{fontSize: '10px', margin: '5px'}}>Powered by Crafter721, Klay-Gacha-Machine</div>
      </Stack>
      </Box>
    </div>
  );
}

