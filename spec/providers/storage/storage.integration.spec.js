describe("integration: storage.isolated.json", INTEGRATIONTEST.storage.bind(this, "/providers/storage/isolated/storage.isolated.json"));
describe("integration: storage.shared.json", INTEGRATIONTEST.storage.bind(this, "/providers/storage/shared/storage.shared.json", false));
describe("integration: storage.indexeddb.json", INTEGRATIONTEST.storage.bind(this, "/providers/storage/indexeddb/storage.indexeddb.json"));
describe("integration: storebuffer.indexeddb.json", INTEGRATIONTEST.storebuffer.bind(this, "/providers/storage/indexeddb/storebuffer.indexeddb.json"));
