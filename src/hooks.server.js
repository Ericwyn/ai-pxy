// import {fetch} from '@sveltejs/kit/fetch'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {

    console.log('request url ---> ', event.url.pathname)


	// 如果是首页的话，正常请求
	if (event.url.pathname == "/" || event.url.pathname == "/index" || event.url.pathname == "/index.html") {
		return await resolve(event)
	}
	
	// const geminiProxyHeader = {
	// 	'Content-Type': 'application/json',
	// 	'Accept': '*/*',
	// }

	const proxyMap = new Map([
		['/gemini/', newProxySet({
			url: "https://generativelanguage.googleapis.com/"
		})],
		['/openai/', newProxySet({
			url: "https://api.openai.com/"
		})],
	]);

	// 检查请求是否匹配代理规则
	for (const [sourcePrefix, proxySet] of proxyMap) {
		if (event.url.pathname.startsWith(sourcePrefix)) {
			const targetPath = event.url.pathname.replace(sourcePrefix, proxySet.url);
			const targetUrl = new URL(targetPath + "/" + event.url.search);
			
			// console.log("==============================================")
			// console.log("from: " + event.url)
			// // console.log("proxy to: " + targetUrl)
			// printHeader(event.request.headers)
			// console.log("==============================================")


			event.request.headers.delete("connection");
			event.request.headers.delete('x-forwarded-for');
			event.request.headers.delete('x-real-ip');
			event.request.headers.delete('x-vercel-forwarded-for');
			event.request.headers.delete("x-forwarded-host");
			event.request.headers.delete("x-vercel-ip-country-region");
			event.request.headers.delete('host');
			event.request.headers.delete('forwarded');
			// event.request.headers.delete('accept-encoding'); // 移除Accept-Encoding头

			try {
				// 创建一个新的请求对象，移除源IP信息
				const proxyRequest = new Request(targetUrl, {
					method: event.request.method,
					body: event.request.method !== 'GET' ? await event.request.arrayBuffer() : undefined,
					headers: event.request.headers
				});

				// // 移除可能包含IP信息的头部
				// proxyRequest.headers.delete('x-forwarded-for');
				// proxyRequest.headers.delete('forwarded');
				// proxyRequest.headers.delete('accept-encoding'); // 移除Accept-Encoding头

				console.log("==============================================")
				console.log("fetch: " + proxyRequest.url)
				printHeader(proxyRequest.headers)
				console.log("==============================================")
	
				// 发送代理请求
				const response = await fetch(proxyRequest);
				
				// // 检查响应头中的Content-Type
				// const contentType = response.headers.get('Content-Type');

				// let responseBody;
				// if (contentType && contentType.includes('application/json')) {
				// 	// 如果是JSON，转换为JSON对象
				// 	responseBody = await response.json();
				// 	// 打印JSON响应体
				// 	console.log("Response Body JSON");
				// 	console.log(responseBody)
				// 	// 将JSON对象转换回字符串，以便重新创建响应
				// 	responseBody = JSON.stringify(responseBody);
				// 	console.log("==============================================")
				// 	printHeader(response.headers)
				// 	console.log("==============================================")
					
				// 	// return new Response(responseBody, {
				// 	// 	headers: new Headers({
				// 	// 		"x-xss-protection": "0",
				// 	// 		"x-frame-options": "SAMEORIGIN",
				// 	// 		"x-content-type-options": "nosniff",
				// 	// 		"vary": "Origin, X-Origin, Referer",
				// 	// 		"transfer-encoding": "chunked",
				// 	// 		"server-timing": "gfet4t7; dur=100",
				// 	// 		"server": "scaffolding on HTTPServer2",
				// 	// 		// "date": "Fri, 15 Dec 2023 16:03:24 GMT",
				// 	// 		"content-type": "application/json; charset=UTF-8",
				// 	// 		// "content-encoding": "gzip",
				// 	// 		// "cache-control": "private",
				// 	// 		// 'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
				// 	// 		// 'Content-Type': 'application/json',
				// 	// 	})
				// 	// });
				// } else {
				// 	// 否则，读取为文本
				// 	responseBody = await response.text();
				// 	// 打印文本响应体
				// 	console.log("Response Body Text:");
				// 	console.log(responseBody)
				// 	// return new Response(responseBody);
				// }

				// console.log("get proxy response")
				// console.log("==============================================")
				// printHeader(response.headers)
				// console.log("==============================================")

				// 复制 headers
				const newHeaders = new Headers(response.headers);
				
				// 删除特定的 header
				// 如果使用该 header 的话 gemini 接口无法正确返回
				newHeaders.delete('content-encoding');

				// 返回代理响应
				// return response;
				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: newHeaders
				});
			} catch (error) {
				// 如果代理请求失败，返回错误信息
				console.error('Proxy error:', error);
				return new Response('Proxy error, ' + error, { status: 502 });
			}
		}
	}

	// 如果没有匹配的代理规则，继续处理正常的请求
	return new Response('proxy error');
}

/**
 * Prints each header from a Headers object.
 * @param {Headers} headers - The Headers object to print.
 */
function printHeader(headers) {
	headers.forEach((value, key) => {
		console.log(`${key}: ${value}`);
	});	
}



/**
 * @typedef {Object} ProxySet
 * @property {string} url - url
 * @property {Record<string,string>} [header] - 额外的 header
 */

/**
 * 创建一个代理配置
 * @param {ProxySet} proxySet - 代理配置
 * @returns {ProxySet} 代理配置
 */
function newProxySet(proxySet) {
	// ...创建用户的逻辑...
	return proxySet; // 这里只是一个示例
  }
  