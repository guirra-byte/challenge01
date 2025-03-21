import fs from "node:fs";

const measureRegExp = new RegExp(
  /\b\d+\s?(?:L|litro|litros|k|quilo|kg|g|grama|gramas|ml|mL)\b/gi
);

function normalizeMeasure(text) {
  return text.replace(measureRegExp, (_, qty, unit) => {
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
      const [measure] = measureRegExp.exec(currentProduct.title);

      const normalizedMeasure = normalizeMeasure(measure);
      const title = currentProduct.title
        .replace(`${measure}`, normalizedMeasure)
        .split(" ");

      const recursiveFilter = (words, index, accumulator) => {
        if (index >= words.length) return accumulator;

        const word = words[index];
        const filtered = accumulator.filter((product) => {
          const left = new Set(product.title.split(" "));
          const right = new Set(words);

          const intersection = new Set([...left].filter((x) => right.has(x)));

          const union = new Set([...left, ...right]);
          const similarity = intersection.size / union.size;
          return product.title.includes(word) || similarity >= 0.5;
        });

        return recursiveFilter(
          words,
          index + 1,
          filtered.length === 0 ? accumulator : filtered
        );
      };

      const matches = recursiveFilter(title, 0, data);
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
