import { Player } from './player.model';
import { EventEmitter, Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Stores and retrieves player related information.
 */
@Injectable()
export class PlayersService {
    private dataChangeSubscription: Subscription;

    // constructor.
    constructor(private db: AngularFirestore, private authSvc: AuthService) {
        console.log('[players] waiting for login...');
        this.authSvc.onSignInOut.subscribe((message) => {
            if (message === 'signout-pending') {
                this.unsubscribeFromDataSources();
            } else if (message === 'signin-done') {
                this.subscribeToDataSources();
            } else {
                console.log('[players] unexpected message from auth svc: ' + message);
            }
        });

        // if already logged in, there will be no notification for signin-done.
        // simulate the event now.
        if (this.authSvc.isAuthenticated()) {
            this.subscribeToDataSources();
        }
    }

    private serverPlayers: Observable<Player[]>;

    private playerList: Player[] = [];

    playerSelectedEvent = new EventEmitter<Player>();
    playerDataChangeEvent = new EventEmitter<Player>();

    /**
     * @deprecated
     */
    subscribeToDataSourcesOld() {
        console.log('[players] subscribing to data sources');

        // subscribe to firebase collection changes.
        const playersCol = this.db.collection<Player>('players');
        this.serverPlayers = playersCol.valueChanges();

        this.dataChangeSubscription = this.serverPlayers.subscribe(
            (values) => {
                console.log('[players] firebase data change', values);
                this.playerList = values;
                this.playerDataChangeEvent.emit();
            }
        );
    }

    subscribeToDataSources() {
        console.log('[players] subscribing to data sources');

        // subscribe to firebase collection changes.
        const currentRatings = this.db.doc('ratings/current2').get();
        this.dataChangeSubscription = currentRatings.subscribe(playerListDoc => {
            if (!playerListDoc.exists) {
                return;
            }

            const playersArray: Player[] = playerListDoc.get('players');
            this.playerList = playersArray;
            this.playerDataChangeEvent.emit();
        });
    }

    unsubscribeFromDataSources() {
        console.log('[players] unsubscribing from data sources');
        if (this.dataChangeSubscription) {
            this.dataChangeSubscription.unsubscribe();
        }
    }

    getPlayers() {
        return this.playerList.slice();
    }

    addPlayer(player: Player) {
        console.log('[playerssvc] added player');
        this.playerList.push(player);
        this.saveSinglePlayerToFirebase(player);
    }

    getPlayerById(id: number) {
        return this.playerList.find(
            item => item.id === id);
    }

    /**
     * Updates a player, based on the ID.
     * @param id The ID of the player.
     * @param newPlayer The new object (already constructed) to use.
     */
    updatePlayerById(id: number, newPlayer: Player): boolean {
        const oldIndex = this.playerList.findIndex((playerItem) => (playerItem.id === id));
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }

        this.playerList[oldIndex] = newPlayer;
        console.log('[players.svc] Replaced player for id ' + id + '. New one', newPlayer);

        this.updateSinglePlayerToFirebase(newPlayer);

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

    /**
     * @deprecated
     */
    saveAllPlayersOld() {
        const playersRef = this.db.collection('/players').ref;
        this.playerList.forEach((player) => {
            let obj = {};
            obj = { ...player };
            playersRef.doc(player.id.toString()).set(obj);
        });
    }

    saveAllPlayers() {
        const playersRef = this.db.doc('/ratings/current2').ref;
        const obj = { players: this.playerList };

        playersRef.set(obj, { merge: true })
    }

    saveSinglePlayerToFirebaseOld(player: Player) {
        const playersRef = this.db.collection('/players').ref;
        const obj = { ...player };
        playersRef.doc(player.id.toString()).set(obj);
    }

    updateSinglePlayerToFirebaseOld(player: Player) {
        const playersRef = this.db.collection('/players').ref;
        const obj = { ...player };
        playersRef.doc(player.id.toString()).update(obj);
    }
    saveSinglePlayerToFirebase(player: Player) {
        this.saveAllPlayers();
    }

    updateSinglePlayerToFirebase(player: Player) {
        this.saveAllPlayers();
    }
}
