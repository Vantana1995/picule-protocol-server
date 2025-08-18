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
    icorequests(where: { transaction_: { blockNumber_gt: $fromBlock } }, orderBy: createdAt, orderDirection: desc) {
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
    contributions(where: { transaction_: { blockNumber_gt: $fromBlock } }, orderBy: timestamp, orderDirection: desc) {
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
    projects(where: { transaction_: { blockNumber_gt: $fromBlock } }, orderBy: createdAt, orderDirection: desc) {
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
    sales(where: { transaction_: { blockNumber_gt: $fromBlock } }, orderBy: timestamp, orderDirection: desc) {
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
    }
      # Updated accounts (those with recent activity)
    accounts(where: { 
      or: [
        { contributions_: { transaction_: { blockNumber_gt: $fromBlock } } },
        { salesAsBuyer_: { transaction_: { blockNumber_gt: $fromBlock } } },
        { salesAsSeller_: { transaction_: { blockNumber_gt: $fromBlock } } },
        { icoRequests_: { transaction_: { blockNumber_gt: $fromBlock } } }
      ]
    }) {
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
    }
  }
`;

module.exports = {
  GET_UPDATES_FROM_BLOCK,
};
