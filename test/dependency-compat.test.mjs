import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const cliRoot = path.dirname(require.resolve('@expo/cli/package.json'));
const { PluginSchema, DevToolsPluginOutputSchema } = require(path.join(cliRoot, 'build/src/start/server/DevToolsPlugin.schema.js'));
const { createMCPDevToolsExtensionSchema } = require(path.join(cliRoot, 'build/src/start/server/createMCPDevToolsExtensionSchema.js'));

test('Expo plugin and output schemas retain valid/invalid input behavior with the security override', () => {
  const plugin = { packageName: 'synthetic-tools', packageRoot: '/synthetic', bannerTitle: 'Test', cliExtensions: {
    description: 'Fixture', entryPoint: '/synthetic/index.js', commands: [
      { name: 'inspect', title: 'Inspect', environments: ['cli', 'mcp'], parameters: [
        { name: 'target', type: 'text' }, { name: 'count', type: 'number' }, { name: 'confirm', type: 'confirm' }
      ] }
    ]
  } };
  assert.equal(PluginSchema.safeParse(plugin).success, true);
  assert.equal(PluginSchema.safeParse({ ...plugin, packageName: '' }).success, false);
  assert.equal(PluginSchema.safeParse({ ...plugin, cliExtensions: { ...plugin.cliExtensions, commands: [] } }).success, false);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'text', text: 'fixture', level: 'info' }, { type: 'image', url: 'https://example.invalid/a.png' }]).success, true);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'text', text: 'fixture', level: 'unknown' }]).success, false);
  const command = createMCPDevToolsExtensionSchema(plugin);
  assert.equal(command.safeParse({ command: 'inspect', target: 'fixture', count: 3, confirm: true }).success, true);
  for (const value of [{ command: 'other' }, { command: 'inspect', count: '3' }, { command: 'inspect', extra: true }, { command: 'inspect', confirm: 'true' }]) assert.equal(command.safeParse(value).success, false);
});

test('Firestore retains the gRPC client/channel API without opening a network connection', async () => {
  const firestoreRoot = path.dirname(require.resolve('@firebase/firestore/package.json'));
  const firestoreRequire = createRequire(path.join(firestoreRoot, 'package.json'));
  const grpc = firestoreRequire('@grpc/grpc-js');
  assert.equal(typeof grpc.Client, 'function'); assert.equal(typeof grpc.credentials.createSsl, 'function');
  assert.equal(typeof grpc.makeGenericClientConstructor, 'function');
  const client = new grpc.Client('127.0.0.1:1', grpc.credentials.createInsecure());
  client.close();
  const firestore = await import('firebase/firestore');
  assert.equal(typeof firestore.getFirestore, 'function'); assert.equal(typeof firestore.getDocs, 'function');
});
