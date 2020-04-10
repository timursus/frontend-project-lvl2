import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import parse from './parsers';
import render from './formatters';

const buildDiffTree = (dataBefore, dataAfter) => {
  const keys = _.union(Object.keys(dataBefore), Object.keys(dataAfter));
  return keys.sort().map((key) => {
    const [valueOld, valueNew] = [dataBefore[key], dataAfter[key]];

    if (!_.has(dataBefore, key) || !_.has(dataAfter, key)) {
      return {
        key, valueOld, valueNew, status: _.has(dataAfter, key) ? 'added' : 'deleted',
      };
    }

    if (_.isPlainObject(valueOld) && _.isPlainObject(valueNew)) {
      return { key, children: buildDiffTree(valueOld, valueNew) };
    }

    return {
      key, valueOld, valueNew, status: (valueOld === valueNew) ? 'unchanged' : 'changed',
    };
  });
};

export default (pathToFile1, pathToFile2, format) => {
  const [extension1, extension2] = [path.extname(pathToFile1), path.extname(pathToFile2)];
  if (extension1 !== extension2) {
    throw new Error(`Incorrect arguments! The files have different extensions: '${extension1}', '${extension2}'`);
  }
  const data1 = fs.readFileSync(pathToFile1, 'utf8');
  const data2 = fs.readFileSync(pathToFile2, 'utf8');
  const [parsedData1, parsedData2] = [parse(data1, extension1), parse(data2, extension2)];
  const diff = buildDiffTree(parsedData1, parsedData2);
  return render(diff, format);
};
