import fs from "node:fs";

const quantityRegExp = new RegExp(
  /\b\d+\s?(?:L|litro|litros|k|quilo|kg|g|grama|gramas|ml|mL)\b/gi
);
function normalizeMeasure(text) {
  return text.replace(quantityRegExp, (_, qty, unit) => {
    const normalized = {
      litro: "L",
      litros: "L",
      L: "L",
      ml: "mL",
      mL: "mL",
      quilo: "kg",
      quilos: "kg",
      k: "kg",
      kg: "kg",
      grama: "g",
      gramas: "g",
      g: "g",
    };

    return `${qty}${normalized[unit.toLowerCase()] || unit}`;
  });
}
const pipeline = async () => {
  const rs = fs.createReadStream("./data01.json");
  rs.on("data", (chunk) => {
    const data = JSON.parse(chunk.toString());

    let reply = [];
    for (let index = 0; index < data.length; index++) {
      const currentProduct = data[index];
      const [measure] = quantityRegExp.exec(currentProduct.title);

      const normalizedMeasure = normalizeMeasure(measure);
      const title = currentProduct.title
        .replace(`${measure}`, normalizedMeasure)
        .split(" ");

      const recursiveFilter = (words, index, accumulator) => {
        if (index >= words.length) return accumulator;

        const word = words[index];
        const filtered = accumulator.filter(
          (product) =>
            product.title.includes(word) && product.id !== currentProduct.id
        );

        return recursiveFilter(
          words,
          index + 1,
          filtered.length === 0 ? accumulator : filtered
        );
      };

      const matches = recursiveFilter(title, 0, data);
      console.log(matches)
      const products = matches.map((match) => {
        return { title: match.title, supermarket: match.supermarket };
      });

      data.splice(index, 1);
      reply.push({
        category: currentProduct.title,
        count: matches.length,
        products,
      });
    }

    console.log(reply);
  });
};

pipeline();
