import React, { useEffect, useState } from 'react';
import { useMoralis, useMoralisWeb3Api } from "react-moralis";

import Moralis from "moralis";
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
//import { makeStyles } from "@material-ui/core/styles";

import './App.css';
import NftCardComponent from './components/NftCardComponent';

interface ICollection {
  img: string;
  title: string;
  collections: any;
}

function App() {

  const { authenticate, isAuthenticated, isAuthenticating, user, account, logout } = useMoralis();
  const Web3Api = useMoralisWeb3Api();

  const [collections, setCollections] = useState<{ adr: string, title: string, img: string }[]>([]);
  const [duration, setDuration] = useState<string>('');

  let currentDate = new Date();
  let fromDate = new Date();
  let toDate = new Date();
  fromDate.setTime(currentDate.getTime() - 30 * 60 * 1000);
  toDate.setTime(fromDate.getTime() + 60 * 1000)

  useEffect(() => {
    if (isAuthenticated) {
      // add your logic here
      fetchSalesTxn();
//      getWalletNetWorth("0x0144eDf8DDBccD66ddc5cC9075a6e2Cfa937b8dE");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, duration]);

  const login = async () => {
    if (!isAuthenticated) {

      await authenticate({signingMessage: "Log in using Moralis" })
        .then(function (user) {
          console.log("logged in user:", user);
          console.log(user!.get("ethAddress"));
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }

  const logOut = async () => {
    await logout();
    console.log("logged out");
  }

  const countCollectionToAddress:any = {};
  const colObject:{ adr: string, title: string, img: string }[] = [];

  const getNftValue = async (result:any[]) => {
    const nftCounts:any = {};
    let netWorth = 0;

    // calculate NFT count for each collections   
    result.forEach((res) => {
      const { token_address, amount } = res;
      nftCounts[token_address] = nftCounts[token_address] || 0;
      nftCounts[token_address] += parseInt(amount);
    });

    console.log(nftCounts);

    // calculate NFT Net Worth
    for (var key in nftCounts) {
      if (nftCounts.hasOwnProperty(key)) {
        await Web3Api.token.getNFTLowestPrice({address: key})
          // eslint-disable-next-line no-loop-func
          .then((floor) => {
            netWorth += parseFloat(Moralis.Units.FromWei(floor.price)) * nftCounts[key];
            console.log(netWorth);
          })
          .catch((err) => console.log(err));;
      }
    }

    console.log(netWorth);
  }

  const getWalletNetWorth = async (address:string) => {
    // console.log(address);
    let walletNFTs:any = await Web3Api.account.getNFTs({
      address: address,
    });

    console.log(walletNFTs.result);
    getNftValue(walletNFTs.result);
    while (walletNFTs.next) {
      walletNFTs = await walletNFTs.next();
      getNftValue(walletNFTs.result);
    }
  }


  const analysisSalesTxn = async (result:any[]) => {

    result.forEach((res) => {
      if (res.value !== "0") {
        const { token_address, to_address, amount } = res;
        
        if (!countCollectionToAddress[token_address]) {
          countCollectionToAddress[token_address] = {};
        }
        countCollectionToAddress[token_address][to_address] = countCollectionToAddress[token_address][to_address] || 0;
        countCollectionToAddress[token_address][to_address] += parseInt(amount);
      }
    });
  }

  const fetchSalesTxn = async () => {

    fromDate.setTime(toDate.getTime());
    toDate.setTime(fromDate.getTime() + 60 * 1000)
      
    let salesTxns:any = await Web3Api.token.getNftTransfersFromToBlock({
      from_date: fromDate.toString(),
      to_date: toDate.toString(),
      format: "decimal",
    });

    do {
      analysisSalesTxn(salesTxns.result);
      salesTxns = await salesTxns.next();
    } while (salesTxns.cursor);

    console.log(countCollectionToAddress);
    
    for (const [key, value] of Object.entries(countCollectionToAddress)) {
      
      await Web3Api.token.getTokenIdMetadata({
        address: key,
        token_id: "1",
        chain: "eth",
      }).then((metaData:any) => {

        const obj = JSON.parse(metaData.metadata);
        colObject.push({adr:key, title:metaData.name, img: fixURL(obj.image)});
      })
      .catch((err) => console.log(err));

      console.log(colObject);
      if (colObject.length > 5) {
        break;
      }
    }

    setCollections(colObject);
    setDuration(`${fromDate.toISOString().split('.')[0].replace('T', ' ')} - ${toDate.toISOString().split('.')[0].replace('T', ' ')}`);
  };

  // const fixURL = (url:string) => {
  //   if(url.startsWith("ipfs")){
  //     return "https://ipfs.moralis.io:2053/ipfs/"+url.split("ipfs://ipfs/").slice(-1)[0];
  //    }
  //   else{
  //    return url+"?format=json"
  //    }
  // }
  
  function fixURL(url:string) : any {
    let returnURL : string;
    if(url.startsWith("ipfs")){
      returnURL = "https://ipfs.moralis.io:2053/ipfs/"+url.split("ipfs://").slice(-1)[0];
     }
    else {
      returnURL = url;
    }

    return returnURL;
  }
   
  const loginButton = !isAuthenticated ? <Button variant="contained" onClick={login}>Log In</Button> : <Button variant="contained" onClick={logOut}>Log Out</Button>;
  
  return (
    <>
      {loginButton}
      <Paper sx={{
        p: 2,
        margin: 'auto',
        maxWidth: 500,
        flexGrow: 1,
        backgroundColor: '#E7EBF0',
      }}>
        {duration}
        <Grid container spacing={2}>
          {
            collections.map(col => {
              return (
                <Grid item xs={12}>
                  <NftCardComponent cltURL={col.img} cltName={col.title} cltAdr={col.adr} />
                </Grid>
                );
            })
          }
        </Grid>
      </Paper>
    </>
  );
}

export default App;
