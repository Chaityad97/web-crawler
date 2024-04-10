const {JSDOM} = require('jsdom')
async function crawlPage(baseURL,currentURL,pages){
  const currentObj = new URL(currentURL)
  const baseObj = new URL(baseURL)
  if(currentObj.hostname !== baseObj.hostname){
      return pages
  }
  const normalisedURL = normalizeURL(currentURL)
  if(pages[normalisedURL] > 0){
      pages[normalisedURL]++ 
      return pages
  }
  pages[normalisedURL] = 1
  console.log(`currently crawling ${currentURL}`)
  try{
    const resp = await fetch(currentURL)
    if(resp.status > 399){
      console.log(`error is fecth status code ${resp.status} on page ${currentURL}`)
      return pages
    }
    const contentType = resp.headers.get("content-type")
    if(!contentType.includes("text/html")){
      console.log(`not an html respnse, it is a  ${contentType} on page ${currentURL}`)
      return pages
    }
    const htmlBody = await resp.text()
    const nexturls = await getURLsFromHTML(htmlBody,baseURL)
    for(const nexturl of nexturls){
      pages = await crawlPage(baseURL,nexturl,pages)
    }
  }catch(err){
    console.log(`error in fetch ${err.message} , in the ${currentURL}`)
  }
  return pages
}

function getURLsFromHTML(htmlBody,baseURL){
  const urls = []
  const dom = new JSDOM(htmlBody)
  const linkElements = dom.window.document.querySelectorAll('a')
  for (const linkElement of linkElements){
    if(linkElement.href.slice(0,1)== '/'){ //when only like /path is given
      try{
        urlString = `${baseURL}${linkElement.href}`
        const urlObj = new URL(urlString) 
        urls.push(urlObj.href)
    }catch(err){
      console.log(`error with url ${err.message}`)
    }
      
    }else{
      try{
        urlString = `${linkElement}`
        const urlObj = new URL(urlString) 
        urls.push(urlObj.href)
    }catch(err){
      console.log(`error with url ${err.message}`)
    }
    
    }
  }
  return urls
}
function normalizeURL(urlString){
  const urlObj = new URL(urlString) 
  const hostPath = `${urlObj.hostname}${urlObj.pathname}`
  if(hostPath.length>0 && hostPath.slice(-1) === '/'){
    return hostPath.slice(0,-1)
  }
  return hostPath
}

module.exports ={
  normalizeURL,
  getURLsFromHTML,
  crawlPage
}