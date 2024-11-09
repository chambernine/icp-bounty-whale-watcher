import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";

actor WhaleWatcher {
    // Type definitions
    type Transfer = {
        from: Text;
        to: Text;
        amount: Nat;
        timestamp: Int;
        nftMinted: Bool;
    };

    type Stats = {
        totalWhales: Nat;
        totalVolume: Nat;
        largestTransfer: Nat;
    };

    // State variables
    private stable var transfers : [Transfer] = [];
    private let transferBuffer = Buffer.Buffer<Transfer>(0);
    private stable var stats : Stats = {
        totalWhales = 0;
        totalVolume = 0;
        largestTransfer = 0;
    };

    // Constants
    private let WHALE_THRESHOLD : Nat = 1_000_000; // $1 million in USDC

    // Helper function to update stats
    private func updateStats(amount : Nat) {
        stats := {
            totalWhales = stats.totalWhales + 1;
            totalVolume = stats.totalVolume + amount;
            largestTransfer = if (amount > stats.largestTransfer) amount else stats.largestTransfer;
        };
    };

    // Add a new whale transfer
    public shared(msg) func addWhaleTransfer(from : Text, to : Text, amount : Nat) : async Result.Result<(), Text> {
        if (amount < WHALE_THRESHOLD) {
            return #err("Transfer amount below whale threshold");
        };

        let transfer : Transfer = {
            from = from;
            to = to;
            amount = amount;
            timestamp = Time.now();
            nftMinted = false; // Will be updated when NFT is minted
        };

        transferBuffer.add(transfer);
        transfers := Buffer.toArray(transferBuffer);
        
        updateStats(amount);

        // TODO: Implement NFT minting logic here
        // For now, we'll just return success
        #ok()
    };

    // Query all whale transfers
    public query func getWhaleTransfers() : async [Transfer] {
        // Return transfers in reverse chronological order
        Array.tabulate<Transfer>(
            transfers.size(),
            func (i) = transfers[transfers.size() - 1 - i]
        )
    };

    // Query stats
    public query func getStats() : async Stats {
        stats
    };

    // Function to update NFT minted status
    public shared(msg) func updateNftStatus(txIndex : Nat, minted : Bool) : async Result.Result<(), Text> {
        if (txIndex >= transfers.size()) {
            return #err("Invalid transfer index");
        };

        let transfer = transfers[txIndex];
        let updatedTransfer : Transfer = {
            from = transfer.from;
            to = transfer.to;
            amount = transfer.amount;
            timestamp = transfer.timestamp;
            nftMinted = minted;
        };

        transferBuffer.put(txIndex, updatedTransfer);
        transfers := Buffer.toArray(transferBuffer);

        #ok()
    };

    // For testing: Clear all data
    public shared(msg) func clearAll() : async () {
        transferBuffer.clear();
        transfers := [];
        stats := {
            totalWhales = 0;
            totalVolume = 0;
            largestTransfer = 0;
        };
    };
};