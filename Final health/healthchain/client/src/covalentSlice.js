
/* global BigInt */
// import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { createSlice } from '@reduxjs/toolkit';
import daoList from '../Api/daoList.json';
import { uiActions, uiThunks } from './uiSlice';
import { userActions } from './userSlice';

const initialState = {
  overview: [],
  activeDao: null,
  activeDaoTreasury: null,
};

const covalentSlice = createSlice({
  name: 'covalent',
  initialState,
  reducers: {
    setOverview: (state, action) => {
      const overview = action.payload;
      state.overview = overview;
    },
    clearOverview: (state) => {
      state.overview = [];
    },
    setActiveDao: (state, action) => {
      state.activeDao = action.payload;
    },
    setDaoTreasury: (state, action) => {
      state.activeDaoTreasury = action.payload;
    },
  },
});

export const covalentActions = covalentSlice.actions;

// Helper functions
// function createClient(subgraph) {
//   const client = new ApolloClient({
//     uri: `https://testnet.snapshot.org/graphql`,
//     cache: new InMemoryCache(),
//   });
//   return client;
// }

const getOverview = async (daoTickers, daoAddresses, pageSize = 100) => {
  let daos = [];

  // Fetch latest prices
  const res = await fetch(
    `https://api.covalenthq.com/v1/pricing/tickers/?tickers=${daoTickers.toString()}&key=${'ckey_6562db8ca22f481bb2d1ef24af0'}`
  );
  const { data } = await res.json();

  // Remove duplicate tickers
  daos = data.items.filter(({ contract_address }) =>
    daoAddresses.includes(contract_address)
  );

  // getTokenHolder promise
  const tokenHolderPromises = daos.map(async (dao) => {
    const res = await fetch(
      `https://api.covalenthq.com/v1/1/tokens/${
        dao.contract_address
      }/token_holders/?quote-currency=USD&format=JSON&page-size=${pageSize}&key=${'ckey_6562db8ca22f481bb2d1ef24af0'}`
    );
    return await res.json();
  });

  // resolve tokenHolder promise
  const tokenHoldersObj = await Promise.all(tokenHolderPromises);
  console.log(tokenHoldersObj);

  // add tokenHolder props to each dao in daos array
  daos = daos.map((dao) => {
    const reqTokenHolder = tokenHoldersObj.find(
      (token) =>
        token.error === false &&
        token.data.items[0].contract_address === dao.contract_address
    );
    if (!reqTokenHolder) {
      return { ...dao, tokenHoldersFound: false };
    } else {
      const firstTokenHolder = reqTokenHolder.data.items[0];
      const totalMembers = reqTokenHolder.data.pagination.total_count;
      const totalSupply =
        BigInt(firstTokenHolder.total_supply) /
        BigInt(10 ** firstTokenHolder.contract_decimals);

      const marketCap = parseFloat(totalSupply) * dao.quote_rate;

      const topTokenHolders = reqTokenHolder.data.items.slice(0, 50);
      topTokenHolders.forEach((holder) => {
        holder.value = parseInt(
          BigInt(holder.balance) / BigInt(10 ** holder.contract_decimals)
        );
      });
      const updatedAt = reqTokenHolder.data.updated_at;
      return {
        ...dao,
        treasury: marketCap,
        totalMembers,
        topTokenHolders,
        updatedAt,
      };
    }
  });
  // console.log(daos);
  return daos;
};

export const covalentThunks = {
  getOverviews: () => {
    return async function (dispatch) {
      try {
        dispatch(uiActions.startLoading());

        const daoTickers = [];
        const daoAddresses = [];
        daoList.forEach(({ contractTicker, contractAddress }) => {
          daoTickers.push(contractTicker);
          daoAddresses.push(contractAddress);
        });

        const daos = await getOverview(daoTickers, daoAddresses);
        dispatch(covalentActions.setOverview(daos));
        dispatch(uiActions.stopLoading());
      } catch (error) {
        console.log(error);
        dispatch(uiActions.stopLoading());
        dispatch(
          uiThunks.setError(
            error.hasOwnProperty('message')
              ? error.message
              : 'Something went wrong!'
          )
        );
      }
    };
  },
  getDaoDetails: (contractAddress) => {
    return async function (dispatch, getState) {
      try {
        dispatch(uiActions.startLoading());
        let reqDao;
        // if (overview && overview.length) {
        //   reqDao = overview.find(
        //     (dao) => dao.contract_address === contractAddress
        //   );
        //   // console.log(reqDao);
        // } else {
        const { contractTicker } = daoList.find(
          (dao) => dao.contractAddress === contractAddress
        );
        reqDao = await getOverview(
          [contractTicker],
          [contractAddress],
          1000000
        );
        reqDao = reqDao[0];
        // console.log(reqDao);
        // }

        if (!reqDao) {
          throw new Error('Dao not found. Please try again.');
        }
        // console.log(reqDao);
        dispatch(covalentActions.setActiveDao(reqDao));
        dispatch(uiActions.stopLoading());
      } catch (error) {
        console.log(error);
        dispatch(covalentActions.setActiveDao(null));
        dispatch(uiThunks.setError(error.message));
        dispatch(uiActions.stopLoading());
      }
    };
  },
  getUserDaos: () => {
    return async function (dispatch, getState) {
      try {
        const state = getState();
        if (!state.user.isLoggedIn || !state.user.user) return;

        let balanceResponse = await fetch(
          `https://api.covalenthq.com/v1/1/address/${
            state.user.user
          }/balances_v2/?quote-currency=USD&format=JSON&nft=false&no-nft-fetch=false&key=${'ckey_6562db8ca22f481bb2d1ef24af0'}`
        );
        balanceResponse = await balanceResponse.json();
        const balances = balanceResponse.data.items;
        console.log(balances);
        if (!balances.length) {
          console.log('No daos');
          return;
        }

        dispatch(userActions.setBalances(balances));
      } catch (error) {
        console.log(error);
        dispatch(uiThunks.setError(error.message));
      }
    };
  },
  getTreasuryOverTime: (contract) => {
    return async function (dispatch) {
      const date = new Date();
      const curYear = date.getFullYear();
      const month = date.getMonth();
      const dates = [];
      let newDate;
      for (let i = month; i <= 11; i++) {
        newDate = new Date(curYear - 1, i, 1, 0, 0, 0, 0);
        dates.push(newDate);
      }

      for (let i = 0; i <= month; i++) {
        newDate = new Date(curYear, i, 1, 0, 0, 0, 0);
        dates.push(newDate);
      }

      // console.log(dates);
      const blockHeightsPromises = dates.map(async (startDate) => {
        const stopDate = new Date(startDate.getTime() + 60 * 1000);
        // console.log(
        //   `https://api.covalenthq.com/v1/1/block_v2/${startDate.toISOString()}/${stopDate.toISOString()}/?quote-currency=USD&format=JSON&page-size=25000&page-number=&key=ckey_6562db8ca22f481bb2d1ef24af0`
        // );
        const res = await fetch(
          `https://api.covalenthq.com/v1/1/block_v2/${startDate.toISOString()}/${stopDate.toISOString()}/?quote-currency=USD&format=JSON&page-size=25000&page-number=&key=ckey_6562db8ca22f481bb2d1ef24af0`
        );
        return await res.json();
      });

      const blockHeightsRes = await Promise.all(blockHeightsPromises);
      const blockHeights = blockHeightsRes.map(
        (blockHeightObj) => blockHeightObj.data.items[0].height
      );

      // console.log(blockHeights);

      const historicalSupplyProm = blockHeights.map(async (height) => {
        const supplyPromise = await fetch(
          `https://api.covalenthq.com/v1/1/tokens/${contract}/token_holders/?quote-currency=USD&format=JSON&page-size=1&block-height=${height}&key=ckey_6562db8ca22f481bb2d1ef24af0`
        );
        return await supplyPromise.json();
      });
      const historicalSupply = await Promise.all(historicalSupplyProm);
      console.log(dates);
      console.log(historicalSupply);
      let contractDecimals;
      for (let i = 0; i < historicalSupply.length; i++) {
        if (historicalSupply[i].data.items[0]?.contract_decimals) {
          contractDecimals =
            historicalSupply[i].data.items[0].contract_decimals;
        }
        if (contractDecimals) {
          break;
        }
      }

      const finalSupply = historicalSupply.map((item) => {
        return item.data.items[0]?.total_supply ?? 0;
      });
      console.log(finalSupply);
      // console.log('Historical supply', historicalSupply);

      const { contractTicker } = daoList.find(
        (el) => el.contractAddress === contract
      );

      const historicalPricesProm = await fetch(
        `https://api.covalenthq.com/v1/pricing/historical/USD/${contractTicker}/?quote-currency=USD&format=JSON&from=${
          dates[0].toISOString().split('T')[0]
        }&to=${
          dates[dates.length - 1].toISOString().split('T')[0]
        }&prices-at-asc=true&key=ckey_6562db8ca22f481bb2d1ef24af0`
      );

      let historicalPrices = await historicalPricesProm.json();
      historicalPrices = historicalPrices.data.prices;
      const finalPrices = [];
      for (let i = 0; i < dates.length; i++) {
        const priceOnDate = historicalPrices.find(
          (obj) => obj.date === new Date(dates[i]).toISOString().split('T')[0]
        );
        if (priceOnDate) {
          finalPrices.push(priceOnDate.price);
        } else {
          historicalSupply[i] = 0;
          finalPrices.push(0);
        }
      }
      console.log('Historical prices', historicalPrices);
      console.log(finalPrices);

      const treasuryOverTime = {};
      const treasuryDatesOrder = [];
      dates.forEach((date, ind) => {
        treasuryDatesOrder.push(date.toLocaleDateString('en-GB'));
        treasuryOverTime[`${date.toLocaleDateString('en-GB')}`] =
          finalPrices[ind] *
          parseFloat(BigInt(finalSupply[ind]) / BigInt(10 ** contractDecimals));
      });
      // console.log(treasuryDatesOrder);
      // console.log(treasuryOverTime);
      dispatch(
        covalentActions.setDaoTreasury({
          order: treasuryDatesOrder,
          treasury: treasuryOverTime,
        })
      );
      // console.log(historicalPrices.data.prices[0].price);
    };
  },
};

export default covalentSlice;