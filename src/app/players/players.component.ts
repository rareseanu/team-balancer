import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, filterPlayerArray } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MatchService } from '../shared/match.service';
import { CustomPrevGame } from '../shared/custom-prev-game.model';

enum RatingSystem {
  German = 1,
  Romanian
};

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styles: ['']
})

export class PlayersComponent implements OnInit, OnDestroy {
  players: Player[];
  selectedPlayer: Player;
  editMode: boolean;
  playerSelectSubscription: Subscription;
  playerDataChangeSubscription: Subscription;
  searchedName = '';
  loadingConvert = -1;

  ratingHistory: Map<string, Player[]>;
  matchHistory: Map<string, CustomPrevGame>;
  ratingSystems = [];
  ratingChosen: any;
  newBranchName: "";
  ratingScale: RatingSystem

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private matchesSvc: MatchService,
    private router: Router,
    private route: ActivatedRoute) {
    this.selectedPlayer = null;
    this.editMode = false;
  }

  ngOnInit() {
    this.players = this.playersSvc.getPlayers();
    this.ratingSystems = Object.keys(RatingSystem).filter(p => isNaN(Number(p)));
    this.playerDataChangeSubscription = this.playersSvc.playerDataChangeEvent
      .subscribe(
        (player: Player) => {
          console.log('player change');
          if (player == null) {
            // reload all
            this.players = this.playersSvc.getPlayers();
          } else {
            // reload single player only.
            this.players = this.playersSvc.getPlayers();
          }
        }
      );
  }

  ngOnDestroy() {
    if (this.playerSelectSubscription) {
      this.playerSelectSubscription.unsubscribe();
    }
    if (this.playerDataChangeSubscription) {
      this.playerDataChangeSubscription.unsubscribe();
    }
  }

  public canAddPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public playerIsSelected(): boolean {
    return this.selectedPlayer != null;
  }

  public onNewPlayerClicked($event): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  public onSavePlayerClicked($event): void {
    this.playersSvc.saveAllPlayers();
  }

  public async onConvertRatingClicked($event) {
    this.loadingConvert = 1;
    // Reset player ratings.
    for (let player of this.playersSvc.getPlayers()) {
      player.rating = 5;
    }
    this.playersSvc.saveAllPlayers();

    // Delete all rating documents.
    await this.playersSvc.dropPlayerRatings();

    // Create rating entries again, based on the matches whose results were applied.
    let recentMatchNames = [...this.matchesSvc.getRecentMatchListCached()];
    recentMatchNames.forEach(matchName => {
      this.matchesSvc.getMatchForDateAsync(matchName).subscribe((customGame: CustomPrevGame) => {

        if (customGame.appliedResults) {
          const newPlayers = this.playersSvc.updateRatingsForGame(
            this.playersSvc.getPlayers(), customGame
          );

          this.playersSvc.savePlayersToList(this.playersSvc.getPlayers(), matchName);
          this.playersSvc.savePlayersToList(newPlayers, 'current');

        }
      });
    })
    this.loadingConvert = 0;
  }

  async checkDropDown(dropdown: boolean) {
    if (dropdown == true) {
      this.ratingHistory = await this.playersSvc.getRatingHistory();
      this.matchHistory = await this.matchesSvc.getMatchList();
    }
  }

  onSearchContentChange($event) {
    // try to apply the target value.
    const filteredPlayers = filterPlayerArray(this.players, $event.target.value);
    if (filteredPlayers.length === 1) {
      // show special marker?
    }
  }

  changeAction(obj) {
    this.ratingChosen = obj;
    console.log("Chosen rating:");
    console.log(this.ratingChosen);
  }

  changeRatingDropdown(obj: string) {
    this.ratingScale = RatingSystem[obj];
    console.log(this.ratingScale);
  }

  async onNewBranchClicked($event) {
    this.loadingConvert = 1;
    let ratingResetValue, branchToEdit = this.ratingChosen.key;
    switch (this.ratingScale) {
      // German
      case 1:
        ratingResetValue = 2.5;
        break;
      // Romanian
      case 2:
        ratingResetValue = 5;
        break;
      default:
        ratingResetValue = 1;
        break;
    }

    if (this.newBranchName) {
      branchToEdit = branchToEdit.slice(0, 10) + '_' + this.newBranchName;
    }

    // Reset ratings for the chosen date.
    for (let player of Object.values(this.ratingChosen.value.players)) {
      (player as Player).rating = ratingResetValue;
    }

    // Update ratings to 10 scale until the chosen date.
    for (const [key, value] of this.matchHistory.entries()) {
      if (key === this.ratingChosen.key.slice(0, 10)) {
        this.playersSvc.savePlayersToList(this.ratingChosen.value.players, branchToEdit);
        this.playersSvc.addFieldValueToDocument('version', this.ratingScale, branchToEdit);
        if (this.newBranchName) {
          this.playersSvc.addFieldValueToDocument('label', this.newBranchName, branchToEdit);
        }
        break;
      }

      if(value.appliedResults) {
        this.ratingChosen.value.players = this.playersSvc.updateRatingsForGame(
          this.ratingChosen.value.players, value, this.ratingScale
        );
      }
    }


    // Update the rating from the chosen date and save it to current.
    this.matchesSvc.getMatchForDateAsync(this.ratingChosen.key.slice(0, 10)).subscribe((customGame: CustomPrevGame) => {
      if (this.newBranchName) {
        this.playersSvc.addFieldValueToDocument('label', this.newBranchName, 'current');
      } else if(this.ratingChosen.value.label) {
        this.playersSvc.addFieldValueToDocument('label', this.ratingChosen.value.label, 'current');
      } else {
        this.playersSvc.removeFieldFromDocument('label', 'current');
      }

      this.playersSvc.addFieldValueToDocument('version', this.ratingScale, 'current');
      this.ratingChosen.value.players = this.playersSvc.updateRatingsForGame(this.ratingChosen.value.players,
        customGame, this.ratingScale);
      this.playersSvc.savePlayersToList(this.ratingChosen.value.players, 'current');

    });
    this.loadingConvert = 0;
  }
}
