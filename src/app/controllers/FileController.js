import fs from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';
import File from '../models/File';

const asyncUnlink = promisify(fs.unlink);

class FileController {
  async store(request, response) {
    const { originalname: name, filename: path } = request.file;

    const upload = await File.create({
      name,
      path,
    });

    return response.json(upload);
  }

  async delete(request, response) {
    const { id } = request.body;
    const file = await File.findByPk(id);

    const src = resolve(__dirname, '..', '..', '..', 'tmp', 'uploads', file.path);

    await asyncUnlink(src);

    if (!asyncUnlink) {
      return response.status(400).json({ error: 'Impossível deletar arquivo..' });
    }

    await file.destroy();

    return response.json({ ok: 'Arquivo deletado com sucesso' });
  }
}
export default new FileController();
