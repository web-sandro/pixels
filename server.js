import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

// cria a pasta "imagens" se não existir
if (!fs.existsSync("imagens")) {
  fs.mkdirSync("imagens");
}

app.use(express.static("public"));
app.use(express.json({ limit: "50mb" })); // aceitar imagens grandes

// endpoint para salvar imagem
app.post("/save-image", (req, res) => {
  const { imageData, fileName } = req.body;

  if (!imageData || !fileName) return res.status(400).send("Dados inválidos");

  const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
  const filePath = path.join("imagens", fileName);

  fs.writeFile(filePath, base64Data, "base64", (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao salvar a imagem.");
    }
    console.log(`💾 Imagem salva: ${filePath}`);
    res.send("Imagem salva com sucesso na pasta do projeto!");
  });
});

// (opcional) acessar imagens salvas no navegador
app.use("/imagens", express.static(path.join(process.cwd(), "imagens")));

// buscar imagens salvas ou arquivos na pasta imagens
// http://localhost:3000/imagens/nome_da_imagem.png


app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
