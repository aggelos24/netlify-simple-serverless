const axios = require('axios');
const { parse } = require('node-html-parser');
const path = require("path");
const pug = require('pug');

template = `
doctype html
html
	head
		meta(charset='utf-8')
		style
			include styles.css
	body
		table
			tr
				th= 'Symbol'
				th= 'Price'
				th= 'Difference'
				th= 'Percentage'
			- var directionToClass = { up: "green-letters", down: "red-letters", noChange: "dark-gray-letters" }
			each stock in stocks
				tr(class=directionToClass[stock.direction])
					td= stock.symbol
					td= stock.price
					td= stock.diff
					td= stock.percentage
`;

const compiledFunction = pug.compile(template);


exports.handler = async function(event, context) {
	try {
		const stockData = [];
		const res = await axios.get('https://www.capital.gr/finance/realtimeticker2017');
		const raw_html = res.data;
		const root = parse(raw_html);
		const tdElements = root.querySelectorAll('td');

		tdElements.forEach((tdElement, index) => {
			let temp = {};
			if (tdElement.childNodes.length == 3) {
				temp.symbol = tdElement.childNodes[1].innerText.trim();
				temp.price = tdElements[index + 1].childNodes[0].textContent.trim();
				temp.diff = tdElements[index + 2].childNodes[0].textContent.trim();
				temp.percentage = tdElements[index + 3].childNodes[0].textContent.trim();

				if (temp.percentage.includes('+')) {
					temp.direction = 'up';	
				} else if (temp.percentage.includes('-') && temp.percentage.length > 1) {
					temp.direction = 'down';
				} else {
					temp.direction = 'noChange';
				}

				stockData.push(temp);
			}
		});

		return {
			statusCode: 200,
			body: compiledFunction({
				stocks: stockData
			})
		};
	} catch (err) {
		console.error(err);
		return {
			statusCode: 500,
			body: JSON.stringify({message: "Something went wrong"})
		};
	}
}
