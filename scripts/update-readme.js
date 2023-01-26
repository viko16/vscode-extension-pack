#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fetchExtensionsInfo(extensionNameList) {
  return fetch('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
    headers: {
      accept: 'application/json;api-version=7.1-preview.1;excludeUrls=true',
      'content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      filters: [
        {
          criteria: extensionNameList.map((id) => ({
            filterType: 7,
            value: id,
          })),
        },
      ],
    }),
  }).then((res) => res.json());
}

function readPkgContent() {
  return require('../package.json');
}

function formatMarkdown(extensionsResult) {
  if (!Array.isArray(extensionsResult)) {
    return '';
  }
  return extensionsResult
    .map(
      ({ displayName, extensionName, shortDescription }) =>
        `- [${displayName}](https://marketplace.visualstudio.com/items?itemName=${extensionName}) - ${shortDescription}`,
    )
    .sort((a, b) => a.localeCompare(b))
    .join('\n');
}

function rewriteReadmeFile(newContent) {
  const targetFilePath = path.resolve(__dirname, '../README.md');
  const fileContent = fs.readFileSync(targetFilePath, 'utf-8');
  const FLAG = '## Extensions Included in this pack';
  const flagIndex = fileContent.indexOf(FLAG);
  if (flagIndex === -1) {
    throw new Error(`Can\'t find "${FLAG}" in ${targetFilePath}`);
  }
  fs.writeFileSync(targetFilePath, `${fileContent.substring(0, flagIndex)}${FLAG}\n\n${newContent}\n`, 'utf-8');
}

function main() {
  const { extensionPack } = readPkgContent();
  fetchExtensionsInfo(extensionPack).then((result) => {
    const newContent = formatMarkdown(result.results[0].extensions);
    rewriteReadmeFile(newContent);
    console.log('Done.');
  });
}

main();
