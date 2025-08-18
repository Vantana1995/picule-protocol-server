// Main query to get all data on initial load
const GET_ALL_INITIAL_DATA = `
  query GetAllInitialData($first: Int!) {
    # Get current block number for tracking
    _meta {
      block {
        number
      }
    }
    transactions(first: 5) {
      id
      blockNumber
      timestamp
      gasUsed
    }
    # ICO data
    icorequests(first: $first, orderBy: createdAt, orderDirection: desc) {
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

    contributions(first: $first, orderBy: timestamp, orderDirection: desc) {
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

    # Projects and tokens
    projects(first: $first, orderBy: createdAt, orderDirection: desc) {
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

    # ERC20 Tokens
    erc20Tokens(first: $first, orderBy: totalSupply, orderDirection: desc) {
      id
      name
      symbol
      decimals
      totalSupply
      derivedUSD
      derivedMON
      totalTransfers
      totalHolders
    }

    # NFT marketplace data
    listings(first: $first, orderBy: createdAt, orderDirection: desc) {
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

    sales(first: $first, orderBy: timestamp, orderDirection: desc) {
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

    # DEX data (if needed)
    tokens(first: $first, orderBy: txCount, orderDirection: desc) {
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

    pairs(first: $first, orderBy: txCount, orderDirection: desc) {
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
    }

    # Global stats
    globalStats(id: "1") {
      id
      totalProjects
      totalTokensCreated
      totalICORequests
      totalContributions
      totalContributionValue
      totalContributionValueUSD
      totalListings
      totalSales
      totalVolume
      totalVolumeUSD
    }

    # Marketplace stats
    marketplaceStats(id: "1") {
      id
      totalListings
      totalSales
      totalVolume
      totalVolumeUSD
    }

    # Factory data
    piculeFactories(first: 1) {
      id
      pairCount
      totalVolumeUSD
      totalVolumeMON
      untrackedVolumeUSD
      totalLiquidityUSD
      totalLiquidityMON
      txCount
    }
      # Account data
    accounts(first: $first, orderBy: usdSwapped, orderDirection: desc) {
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
  GET_ALL_INITIAL_DATA,
};
