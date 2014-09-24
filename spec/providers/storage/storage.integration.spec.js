describe("integration: storage.isolated.json",
    require('./storage.integration.src').bind(this, "/providers/storage/isolated/storage.isolated.json"));
describe("integration: storage.shared.json",
    require('./storage.integration.src').bind(this, "/providers/storage/shared/storage.shared.json", false));
describe("integration: storage.indexeddb.json",
    require('./storage.integration.src').bind(this, "/providers/storage/indexeddb/storage.indexeddb.json"));
describe("integration: storebuffer.indexeddb.json",
    require('./storage.integration.src').bind(this, "/providers/storage/indexeddb/storebuffer.indexeddb.json", true));
