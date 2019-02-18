import { Player } from './player.model';
import { EventEmitter } from '@angular/core';

export class PlayersService {
    private playerList: Player[] = [
        new Player(1, 'Johnny'),
        new Player(2, 'gus'),
        new Player(3, 'iulian'),
        new Player(4, 'mircea')
    ];

    playerSelectedEvent = new EventEmitter<Player>();
    playerDataChangeEvent = new EventEmitter<Player>();

    getPlayers() {
        return this.playerList.slice();
    }

    addPlayer(player: Player) {
        console.log('[playerssvc] added player');
        this.playerList.push(player);
    }

    getPlayerById(id: number) {
        return this.playerList.find(
            item => item.id === id);
    }

    updatePlayer(oldPlayer: Player, newPlayer: Player): boolean {
        const oldIndex = this.playerList.indexOf(oldPlayer);
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }
        if (oldPlayer.id !== newPlayer.id) {
            // old entry not found?
            console.warn('Tried to update a player using a different ID. Update is meant for the same player ID.');
            return false;
        }
        this.playerList[oldIndex] = newPlayer;
        console.log('Replaced player. New one', newPlayer);
        return true;
    }

    updatePlayerById(id: number, newPlayer: Player): boolean {
        const oldIndex = this.playerList.findIndex((playerItem) => (playerItem.id === id));
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }

        this.playerList[oldIndex] = newPlayer;
        console.log('[players.svc] Replaced player for id ' + id + '. New one', newPlayer);
        return true;
    }

    createDefaultPlayer(): Player {
        // get the id.
        const newID = Math.max.apply(
            Math,
            this.playerList.map((item) => item.id))
            + 1;

        const newName = 'new_player_' + Date.now().toFixed() + '_' + newID;
        const result = new Player(newID, newName);

        return result;
    }



}
