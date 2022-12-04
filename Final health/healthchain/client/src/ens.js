import React from 'react'
// TODO: explore react-ens-address maybe it's enough?
import { ethers } from 'ethers'
import ENS, { getEnsAddress } from '@ensdomains/ensjs'

// TODO: this thing needs to be refactored

const EnsInfo = {
  address: string | null,
  domain: string | null
}

const parseDomain = () => {
  const url = new URL(document.URL)
  if (url.hostname == 'localhost' || url.hostname.endsWith('siasky.net')) {
    return null
  }

  let domain = url.hostname
  if (domain.endsWith('.link') || domain.endsWith('.limo')) {
    domain = domain.substring(0, domain.length - 5)
  }
  // assuming the app is available on a subdomain (e.g. gallery.anon.eth)
  domain = domain.substring(domain.indexOf('.') + 1, domain.length)

  return domain
}

const resolveDomain = async() => {
  const provider = new ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
  )
  const ens = new ENS({ provider, ensAddress: getEnsAddress('1') })

  if (domain === null) {
    return { address: null, domain: null }
  }

  const address = await ens.name(domain).getAddress()
  console.log(`Resolved ${domain} to ${address}`)

  return { address, domain }
}

const useEns = () => {
  const [ensInfo, setEnsInfo] = React.useState<EnsInfo>({
    address: null,
    domain: null,
  })

  React.useEffect(() => {
    ; (async () => {
      let domain = ensInfo.domain
      if (domain === null) {
        domain = parseDomain()
      }
      console.log(`useEffect ${domain}`)
      const resolvedInfo: EnsInfo = await resolveDomain(domain)
      setEnsInfo(resolvedInfo)
    })()
  }, [ensInfo.domain])

  return [ensInfo, setEnsInfo]
}

export { EnsInfo, useEns }