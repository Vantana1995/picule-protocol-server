// graphql/updateQueries.js

// Query to get only new data since specific block
const GET_UPDATES_FROM_BLOCK = `
  query GetUpdatesFromBlock($fromBlock: Int!) {
    # Get current block number
    _meta {
      block {
        number
      }
    }
    

    # New ICO requests since fromBlock
   icorequests(where: { createdAt_gt: $fromBlock }, orderBy: createdAt, orderDirection: desc) {
      id
      numOfRequest
      creator {
        id
      }
      createdAt
      transaction {
        id
        blockNumber
        timestamp
      }
      totalContributions
      totalContributors
      active
    }

    # New contributions since fromBlock
    contributions(where: { timestamp_gt: $fromBlock }, orderBy: timestamp, orderDirection: desc) {
      id
      icoRequest {
        id
        numOfRequest
      }
      numOfProject
      contributor {
        id
      }
      amount
      timestamp
      transaction {
        id
        blockNumber
        timestamp
      }
    }

    # New projects since fromBlock
    projects(where: { createdAt_gt: $fromBlock }, orderBy: createdAt, orderDirection: desc) {
      id
      icoId
      creator {
        id
      }
      token {
        id
        name
        symbol
        decimals
        totalSupply
      }
      nft {
        id
        name
        symbol
        totalSupply
      }
      fundsManager {
        id
      }
      createdAt
      transaction {
        id
        blockNumber
        timestamp
      }
    }

    # New marketplace listings since fromBlock
   listings(where: { createdAt_gt: $fromBlock }, orderBy: createdAt, orderDirection: desc) {
      id
      seller {
        id
      }
      nftContract
      tokenId
      token {
        id
        identifier
        uri
      }
      price
      active
      createdAt
      updatedAt
    }

    # New sales since fromBlock
    sales(where: { timestamp_gt: $fromBlock }, orderBy: timestamp, orderDirection: desc) {
      id
      seller {
        id
      }
      buyer {
        id
      }
      nftContract
      tokenId
      price
      timestamp
      transaction {
        id
        blockNumber
      }
    }

    # New tokens since fromBlock (DEX)
    tokens(where: { lastMinuteRecorded_gt: $fromBlock }, orderBy: txCount, orderDirection: desc) {
      id
      symbol
      name
      decimals
      totalSupply
      tradeVolume
      tradeVolumeUSD
      txCount
      totalLiquidity
      derivedMON
      tokenDayData(first: 7, orderBy: date, orderDirection: desc, where: { date_gte: $fromTimestamp }) {
        id
        date
        dailyVolumeToken
        dailyVolumeMON
        dailyVolumeUSD
        dailyTxns
        totalLiquidityToken
        totalLiquidityMON
        totalLiquidityUSD
        priceUSD
      }
      
      tokenHourData(first: 24, orderBy: periodStartUnix, orderDirection: desc, where: { periodStartUnix_gte: $fromTimestamp }) {
        id
        periodStartUnix
        volume
        volumeUSD
        untrackedVolumeUSD
        totalValueLocked
        totalValueLockedUSD
        priceUSD
        feesUSD
        open
        high
        low
        close
      }
      
      tokenMinuteData(first: 60, orderBy: periodStartUnix, orderDirection: desc, where: { periodStartUnix_gte: $fromTimestamp }) {
        id
        periodStartUnix
        volume
        volumeUSD
        untrackedVolumeUSD
        totalValueLocked
        totalValueLockedUSD
        priceUSD
        feesUSD
        open
        high
        low
        close
      }
    }

    # New pairs since fromBlock
   pairs(where: { createdAtBlockNumber_gt: $fromBlock }, orderBy: createdAtTimestamp, orderDirection: desc) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
      reserve0
      reserve1
      totalSupply
      reserveUSD
      token0Price
      token1Price
      volumeUSD
      txCount
      createdAtTimestamp
      createdAtBlockNumber
      liquidityPositionSnapshots(orderBy: timestamp, orderDirection: asc) {
        id
        timestamp
        account {
          id
        }
        token0PriceUSD
        token1PriceUSD
        reserve0
        reserve1
        reserveUSD
        liquidityTokenTotalSupply
        liquidityTokenBalance
      }
    }
   # Accounts with recent activity
    accounts(
      where: {
        or: [
          { contributions_: { timestamp_gt: $fromBlock } },
          { salesAsBuyer_: { timestamp_gt: $fromBlock } },
          { salesAsSeller_: { timestamp_gt: $fromBlock } },
          { icoRequests_: { createdAt_gt: $fromBlock } }
        ]
      },
      first: 1000
    ) {
      id
      usdSwapped
      liquidityPositions {
        id
        liquidityTokenBalance
      }
      ERC721tokens {
        id
        identifier
      }
      listings {
        id
        price
        active
      }
      salesAsBuyer {
        id
        price
      }
      salesAsSeller {
        id
        price
      }
      contributions {
        id
        amount
        icoRequest {
          numOfRequest
        }
      }
      icoRequests {
        id
        numOfRequest
      }
      createdProjects {
        id
        icoId
      }
      bonusClaims {
        id
        amount1
      }
    }
  }
`;

module.exports = {
  GET_UPDATES_FROM_BLOCK,
};
