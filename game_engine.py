import random
from datetime import datetime

# --- Constants & Data ---

PENDU_WORDS = [
    "DAE", "PCR", "PLS", "LVA", "AVC", "AIT", "MCE", "BAVU", "CHUT", "SMUR",
    "SAMU", "VPSP", "VSAV", "FPT", "EPC", "EPI", "DSA", "RCP", "CO", "O2",
    "TA", "FC", "FR", "SPO2", "GLY", "GCS", "EVA", "EN", "ECG", "UV",
    "UR", "UA", "UD", "UMH", "UMP", "UFORESC", "CUMP", "CA", "CR", "CD",
    "BNSSA", "PSE", "PSC", "SST", "AFGSU", "AMU", "ANSC", "ARS", "CH", "CHU",
    "SDIS", "SSSM", "SP", "SPP", "SPV", "JSP", "BMPM", "BSPP", "DGSCGC", "FNSPF",
    "UDSP", "ADPC", "SNSM", "CRF", "CFS", "FFSS", "UNASS", "ORDRE", "GENDARMERIE", "POLICE",
    "HEMORRAGIE", "ETOUFFEMENT", "MALAISE", "TRAUMATISME", "BRULURE", "PLAIE", "NOYADE", "ELECTRISATION", "INTOXICATION", "ACCOUCHEMENT",
    "OBSTRUCTION", "INCONSCIENCE", "CONVULSION", "HYPOGLYCEMIE", "HYPERGLYCEMIE", "ASTHME", "ANAPHYLAXIE", "INFARCTUS", "ANGINE", "DISSECTION",
    "EMBOLIE", "OAP", "BPCO", "PNEUMOTHORAX", "HEMOTHORAX", "FRACTURE", "ENTORSE", "LUXATION", "CONTUSION", "HEMATOME",
    "ABRAZION", "SECTION", "AMPUTATION", "EVISCERATION", "BRUIT", "LUMIERE", "ODEUR", "FUMEE", "FLAMME", "CHALEUR",
    "FROID", "EAU", "GAZ", "ELEC", "PRODUIT", "CHIMIQUE", "RADIOACTIF", "BIOLOGIQUE", "BACTERIE", "VIRUS",
    "PARASITE", "CHAMPIGNON", "SANG", "SALIVE", "VOMISSEMENT", "URINE", "SELLES", "SUEUR", "LARMES", "LIQUIDE",
    "CEPHALEE", "VERTIGE", "NAUSEE", "DOULEUR", "PARESTHESIE", "PARALYSIE", "APHASIE", "DYSARTHRIE", "DYSPNEE", "APNEE",
    "BRADYPNEE", "TACHYPNEE", "POLYPNEE", "BRADYCARDIE", "TACHYCARDIE", "ARYTHMIE", "HYPOTENSION", "HYPERTENSION", "COLLAPSUS", "CHOC",
    "PALEUR", "CYANOSE", "SUEURS", "MARBRURES", "ICTERE", "ERYTHEME", "OEDEME", "EPISTAXIS", "OTORRAGIE", "HEMATEMESE",
    "MELENA", "RECTORRAGIE", "METROGRAPHIE", "HEMATURIE", "HEMOPTYSIE", "MYDRIASE", "MYOSIS", "ANISOCORIE", "REFLEXE", "PHOTOMOTEUR",
    "ALERT", "VOICE", "PAIN", "UNRESPONSIVE", "A", "B", "C", "D", "E", "X",
    "HEAD", "NECK", "CHEST", "ABDOMEN", "PELVIS", "LEGS", "ARMS", "BACK", "SPINE", "SKIN",
    "SAMPLE", "OPQRST", "METHANE", "SINUS", "ATRIUM", "VENTRICULE", "VALVULE", "AORTE", "CAVE", "PULMONAIRE",
    "SERVITUDE", "PROTECTION", "ALERTE", "BILAN", "GESTE", "SURVEILLANCE", "TRANSMISSION", "HYGIENE", "ASEPSIE", "ANTISEPSIE",
    "DESINFECTION", "STERILISATION", "DASRI", "AES", "EPI", "GANTS", "MASQUE", "LUNETTES", "CHARLOTTE", "BLOUSE",
    "BRANCARD", "CHAISE", "MATELAS", "ATTELLE", "COLLIER", "PLAN", "DUR", "KED", "CIVIERE", "COQUILLE",
    "ASPIRATEUR", "MUCOSITE", "SONDE", "CANULE", "GUEDEL", "BALLON", "MASQUE", "BAVU", "OXYGENE", "BOUTEILLE",
    "MANODETENDEUR", "DEBITLITRE", "MASQUE", "LUNETTES", "CATAPULTE", "TENSION", "BRASSARD", "STETHOSCOPE", "GLUCOMETRE", "BANDELETTE",
    "LANCETTE", "THERMOMETRE", "OXYMETRE", "LAMPE", "PUPILLE", "CISEAUX", "COUVERTURE", "SURVIE", "DRAP", "OREILLER",
    "PANSEMENT", "COMPRESSE", "BANDE", "SPARADRAP", "FILET", "TRIANGULAIRE", "HEMOSTATIQUE", "TOURNIQUET", "GARROT", "COUSSIN",
    "ANTISEPTIQUE", "SERUM", "PHY", "EAU", "SUCRE", "SAVON", "GEL", "HYDRO", "ALCOOLIQUE", "SAC",
    "VOMISSURE", "HARICOT", "BASSIN", "PISTOLET", "URINAL", "REIN", "FOIE", "RATE", "ESTOMAC", "INTESTIN",
    "PANCREAS", "VESICULE", "URETERE", "VESSIE", "URETRE", "OVAIRE", "UTERUS", "TROMPES", "VAGIN", "TESTICULE",
    "PROSTATE", "PENIS", "SCROTUM", "OS", "CARTILAGE", "LIGAMENT", "TENDON", "MUSCLE", "NERF", "VEINE",
    "ARTERE", "CAPILLAIRE", "SANG", "PLASMA", "GLOBULE", "ROUGE", "BLANC", "PLAQUETTE", "LYMPHE", "GANGLION",
    "CERVEAU", "CERVELET", "TRONC", "MOELLE", "EPINIERE", "VERTEBRE", "CERVICALE", "DORSALE", "LOMBAIRE", "SACRUM",
    "COCCYX", "CRANE", "FACE", "MANDIBULE", "CLAVICULE", "OMOPLATE", "STERNUM", "COTES", "HUMERUS", "RADIUS",
    "CUBITUS", "CARPE", "METACARPE", "PHALANGE", "BASSIN", "ILION", "ISCHION", "PUBIS", "FEMUR", "ROTULE",
    "TIBIA", "PERONE", "TARSE", "METATARSE", "CALCANEUM", "ASTRAGALE", "SCAPHOIDE", "CUBOIDE", "CUNEIFORME", "CLAVICULE",
    "ADULTE", "ENFANT", "NOURRISSON", "NE", "PREMA", "VIEILLARD", "OBESE", "ENCEINTE", "HANDICAPE", "PATIENT",
    "VICTIME", "IMPLIQUE", "TEMOIN", "FAMILLE", "PUBLIC", "MEDIA", "AUTORITE", "MAIRE", "PREFET", "PROCUREUR",
    "OPJ", "APJ", "DIRECTEUR", "COS", "DSM", "DOS", "RAC", "RESO", "SINUS", "CERCLE"
]

INTERACTIVE_SCENARIOS = {
    'arret_cardiaque': [
        {
            'id': 'intro',
            'phase': 'Phase 1 : ALERTE',
            'img': 'protec_intervention_start.jpg',
            'speaker': 'PC DPS',
            'text': '« VPSP de PC. Départ immédiat pour malaise sur voie publique. »',
            'choices': [
                {'label': 'Bien reçu : Départ VPSP', 'next': 'departure', 'score': 10},
                {'label': 'Refuser, on est en pause', 'next': 'game_over_refusal', 'score': -100}
            ]
        },
        {
            'id': 'departure',
            'phase': 'Phase 1 : DÉPART',
            'video': 'PROT_S001_S001_T531.mov',
            'speaker': 'Chef d\'équipe',
            'text': 'Le VPSP se met en route. Gyrophares activés. Concentrez-vous.',
            'choices': [
                {'label': 'Arriver sur les lieux', 'next': 'scene_sighting', 'score': 0}
            ]
        },
        {
            'id': 'scene_sighting',
            'phase': 'Phase 1 : ARRIVÉE',
            'img': 'protec_scene.jpg',
            'speaker': 'Conducteur',
            'text': 'Nous sommes sur place. Une victime au sol, foule agitée.',
            'choices': [
                {'label': 'Sécuriser la zone (plots, gilet)', 'next': 'approach', 'score': 10},
                {'label': 'Courir vers la victime', 'next': 'game_over_secu', 'score': -50}
            ]
        },
        {
            'id': 'approach',
            'phase': 'Phase 1 : BILAN',
            'img': 'reagitpas.jpg',
            'speaker': 'Action',
            'text': 'Zone sûre. Vous approchez. La victime ne réagit pas aux ordres.',
            'choices': [
                {'label': 'Contrôler la respiration', 'next': 'diagnosis', 'score': 10},
                {'label': 'Mettre en PLS', 'next': 'game_over_pls', 'score': -50, 'feedback': 'PLS interdite sans vérifier la respiration.'}
            ]
        },
        {
            'id': 'diagnosis',
            'phase': 'Phase 2 : DIAGNOSTIC',
            'img': 'protec_scene.jpg',
            'speaker': 'Bilan',
            'text': 'Pas de mouvement thoracique. Pas de souffle. C\'est un ACR.',
            'choices': [
                {'label': 'Masser immédiatement (30:2)', 'next': 'cpr_loop', 'score': 20},
                {'label': 'Prendre la tension', 'next': 'game_over_time', 'score': -50, 'feedback': 'Perte de temps critique.'}
            ]
        },
        {
            'id': 'cpr_loop',
            'phase': 'Phase 3 : RCP',
            'img': 'defib.png',
            'speaker': 'Action',
            'text': 'Vous commencez le massage. Le DAE arrive. Préparez-vous.',
            'choices': [
                {'label': 'Masser (Mini-jeu)', 'next': 'minigame_cpr', 'score': 0, 'type': 'minigame'},
                {'label': 'Attendre le médecin', 'next': 'game_over_wait', 'score': -50}
            ]
        },
        # NOTE: Minigames require special handling in handshake. 
        # For now, we assume the frontend handles the immediate UI, but reports score back.
        # But to be secure, 'minigame_cpr' is just a state. The frontend plays it, then calls 'action' with result.
        
        {
            'id': 'minigame_cpr',
            'phase': 'Phase 3 : RCP',
             'img': 'defib.png',
            'speaker': 'Mini-Jeu',
            'text': 'Réalisez 30 compressions.',
            'choices': [], # Frontend triggers this
            'next_success': 'dae_setup',
            'next_fail': 'game_over_bad_cpr'
        },

         {
            'id': 'dae_setup',
            'phase': 'Phase 4 : DAE',
            'img': 'protec_scene.jpg',
            'speaker': 'DAE',
            'text': 'Le défibrillateur est là. Il faut agir.',
            'choices': [
                {'label': 'Allumer le défibrillateur', 'next': 'minigame_electrodes', 'score': 10},
                {'label': 'Poser les électrodes', 'next': 'bad_dae', 'score': -10}
            ]
        },
        
         {
            'id': 'minigame_electrodes',
            'phase': 'Phase 4 : DAE',
             'img': 'protec_scene.jpg',
            'speaker': 'Mini-Jeu',
            'text': 'Posez les électrodes.',
            'choices': [],
            'next_success': 'analysing',
             'next_fail': 'dae_setup' # retry?
        },


        {
            'id': 'analysing',
            'phase': 'Phase 5 : ANALYSE',
            'img': 'protec_van.jpg',
            'speaker': 'DAE',
            'text': '« Analyse en cours... Ne touchez pas la victime. »',
            'choices': [
                {'label': 'Écarter tout le monde', 'next': 'shock_advise', 'score': 10},
                {'label': 'Toucher la victime', 'next': 'game_over_dae_touch', 'score': -50}
            ]
        },
        {
            'id': 'shock_advise',
            'phase': 'Phase 5 : CHOC',
            'img': 'protec_van.jpg',
            'speaker': 'DAE',
            'text': '« Choc recommandé. Appuyez sur le bouton orange clignotant. »',
            'choices': [
                {'label': 'Délivrer le choc', 'next': 'minigame_shock', 'score': 10},
                {'label': 'Attendre', 'next': 'game_over_wait', 'score': -50}
            ]
        },
        
         {
            'id': 'minigame_shock',
            'phase': 'Phase 5 : CHOC',
             'img': 'protec_van.jpg',
            'speaker': 'Mini-Jeu',
            'text': 'CHOC !',
            'choices': [],
            'next_success': 'post_shock',
             'next_fail': 'game_over_wait'
        },


        {
            'id': 'post_shock',
            'phase': 'FIN DE CYCLE',
            'img': 'protec_scene.jpg',
            'speaker': 'DAE',
            'text': '« Choc délivré. Reprenez le massage. »',
            'choices': [
                {'label': 'Reprendre RCP', 'next': 'victory', 'score': 20},
                {'label': 'Vérifier le pouls', 'next': 'bad_check', 'score': -20}
            ]
        },
        {
            'id': 'victory',
            'phase': 'SUCCÈS',
            'img': 'protec_team.jpg',
            'speaker': 'SAMU',
            'text': 'Le médecin du SAMU arrive. Vous avez maintenu un massage efficace...',
            'choices': [
                {'label': 'Terminer la mission', 'next': 'FINISH', 'score': 0}
            ]
        },
        
        # FAIL STATES
         { 'id': 'game_over_refusal', 'phase': 'ÉCHEC', 'img': 'echec.jpg', 'speaker': 'Chef', 'text': 'Refus de départ.', 'choices': [], 'is_game_over': True },
         { 'id': 'game_over_secu', 'phase': 'ÉCHEC', 'img': 'echec.jpg', 'speaker': 'Instructeur', 'text': 'Suraccident !', 'choices': [], 'is_game_over': True },
         { 'id': 'game_over_pls', 'phase': 'ÉCHEC', 'img': 'echec.jpg', 'speaker': 'Erreur', 'text': 'PLS interdite sur ACR.', 'choices': [], 'is_game_over': True },
         { 'id': 'game_over_time', 'phase': 'TROP LENT', 'img': 'echec.jpg', 'speaker': 'Temps', 'text': 'Trop lent.', 'choices': [], 'is_game_over': True },
         { 'id': 'game_over_wait', 'phase': 'ÉCHEC', 'img': 'echec.jpg', 'speaker': 'Hésitation', 'text': 'Hésitation fatale.', 'choices': [], 'is_game_over': True },
         { 'id': 'game_over_dae_touch', 'phase': 'DANGER', 'img': 'echec.jpg', 'speaker': 'DAE', 'text': 'Mouvement perturbant.', 'choices': [], 'is_game_over': True },
         { 'id': 'bad_dae', 'phase': 'ÉCHEC', 'img': 'echec.jpg', 'speaker': 'Conseil', 'text': 'Allumer le DAE d\'abord.', 'choices': [], 'is_game_over': True },
         { 'id': 'bad_check', 'phase': 'PERTE DE TEMPS', 'img': 'protec_scene.jpg', 'speaker': 'Proto', 'text': 'Ne pas vérifier le pouls.', 'choices': [{'label': 'Reprendre RCP', 'next': 'victory', 'score': 20}]}
    ],
    'quiz_dps': [
        {
            'id': 'intro',
            'phase': 'Quiz DPS : Question 1/6',
            'img': '../protec38dps/1.jpg',
            'speaker': 'Défi Observation',
            'text': 'Identifiez ce lieu ou ce dispositif.',
            'shuffle': True,
            'choices': [
                {'label': 'Saint-Joseph-de-Rivière', 'next': 'q2', 'score': 10},
                {'label': 'Voiron', 'next': 'feedback_q1', 'score': 0},
                {'label': 'Autrans', 'next': 'feedback_q1', 'score': 0},
                {'label': 'Saint Ismier', 'next': 'feedback_q1', 'score': 0}
            ]
        },
        {
            'id': 'feedback_q1',
            'phase': 'Correction',
            'speaker': 'Formateur',
            'text': 'Faux ! La bonne réponse était : Saint-Joseph-de-Rivière.',
            'choices': [{'label': 'Question suivante', 'next': 'q2', 'score': 0}]
        },
        {
            'id': 'q2',
            'phase': 'Quiz DPS : Question 2/6',
            'img': '../protec38dps/2.jpg',
            'speaker': 'Défi Observation',
            'text': 'Quel est cet événement ?',
            'shuffle': True,
            'choices': [
                {'label': 'Match de rugby', 'next': 'q3', 'score': 10},
                {'label': 'Trail', 'next': 'feedback_q2', 'score': 0},
                {'label': 'Marathon', 'next': 'feedback_q2', 'score': 0},
                {'label': 'Course de vélo', 'next': 'feedback_q2', 'score': 0}
            ]
        },
        {
            'id': 'feedback_q2',
            'phase': 'Correction',
            'speaker': 'Formateur',
            'text': 'Faux ! La bonne réponse était : Match de rugby.',
            'choices': [{'label': 'Question suivante', 'next': 'q3', 'score': 0}]
        },
        {
            'id': 'q3',
            'phase': 'Quiz DPS : Question 3/6',
            'img': '../protec38dps/3.jpg',
            'speaker': 'Défi Observation',
            'text': 'Quel est cet événement ?',
            'shuffle': True,
            'choices': [
                {'label': "Humani'run", 'next': 'q4', 'score': 10},
                {'label': 'Marathon du Vercors', 'next': 'feedback_q3', 'score': 0},
                {'label': 'TNR', 'next': 'feedback_q3', 'score': 0},
                {'label': 'Bike Vercors', 'next': 'feedback_q3', 'score': 0}
            ]
        },
        {
            'id': 'feedback_q3',
            'phase': 'Correction',
            'speaker': 'Formateur',
            'text': "Faux ! La bonne réponse était : Humani'run.",
            'choices': [{'label': 'Question suivante', 'next': 'q4', 'score': 0}]
        },
        {
            'id': 'q4',
            'phase': 'Quiz DPS : Question 4/6',
            'img': '../protec38dps/4.jpg',
            'speaker': 'Défi Observation',
            'text': 'Quel est cet événement ?',
            'shuffle': True,
            'choices': [
                {'label': 'Jazz à Vienne', 'next': 'q5', 'score': 10},
                {'label': 'Foire des Rameaux', 'next': 'feedback_q4', 'score': 0},
                {'label': 'Feux d\'artifice Lac de Paladru', 'next': 'feedback_q4', 'score': 0},
                {'label': 'Fête de la Musique', 'next': 'feedback_q4', 'score': 0}
            ]
        },
        {
            'id': 'feedback_q4',
            'phase': 'Correction',
            'speaker': 'Formateur',
            'text': 'Faux ! La bonne réponse était : Jazz à Vienne.',
            'choices': [{'label': 'Question suivante', 'next': 'q5', 'score': 0}]
        },
        {
            'id': 'q5',
            'phase': 'Quiz DPS : Question 5/6',
            'img': '../protec38dps/5.jpg',
            'speaker': 'Défi Observation',
            'text': 'Quel est cet événement ?',
            'shuffle': True,
            'choices': [
                {'label': 'TNR', 'next': 'q6', 'score': 10},
                {'label': 'Trail d\'Uriage', 'next': 'feedback_q5', 'score': 0},
                {'label': 'Fête de la Musique', 'next': 'feedback_q5', 'score': 0},
                {'label': 'Vercors Musique Festival', 'next': 'feedback_q5', 'score': 0}
            ]
        },
        {
            'id': 'feedback_q5',
            'phase': 'Correction',
            'speaker': 'Formateur',
            'text': 'Faux ! La bonne réponse était : TNR.',
            'choices': [{'label': 'Question suivante', 'next': 'q6', 'score': 0}]
        },
        {
            'id': 'q6',
            'phase': 'Quiz DPS : Question 6/6',
            'img': '../protec38dps/6.jpg',
            'speaker': 'Défi Observation',
            'text': 'Quel est cet événement ?',
            'shuffle': True,
            'choices': [
                {'label': 'VTT Vercors', 'next': 'final', 'score': 10},
                {'label': 'Marathon du Vercors', 'next': 'feedback_q6', 'score': 0},
                {'label': 'TNR', 'next': 'feedback_q6', 'score': 0}
            ]
        },
        {
            'id': 'feedback_q6',
            'phase': 'Correction',
            'speaker': 'Formateur',
            'text': 'Faux ! La bonne réponse était : VTT Vercors.',
            'choices': [{'label': 'Voir les résultats', 'next': 'final', 'score': 0}]
        },
        {
            'id': 'final',
            'phase': 'Terminé',
            'speaker': 'Système',
            'text': 'Quiz terminé. Bravo !',
            'finished': True,
            'choices': []
        }
    ]
}
print(f"DEBUG: LOADED SCENARIOS: {list(INTERACTIVE_SCENARIOS.keys())}")

# --- Game Class Logic ---

class PenduGame:
    MAX_ERRORS = 6
    
    def __init__(self, index=0):
        self.word = PENDU_WORDS[index % len(PENDU_WORDS)]
        self.word_index = index
        self.guessed = set()
        self.wrong_count = 0
        self.finished = False
        self.success = False
        self.score = 0

    def guess(self, letter):
        if self.finished or letter in self.guessed:
            return self.get_state()
        
        self.guessed.add(letter)
        
        if letter not in self.word:
            self.wrong_count += 1
            if self.wrong_count >= self.MAX_ERRORS:
                self.finished = True
                self.success = False
                self.score = 0 # Loss triggers 0 logic usually, or just score stops
        else:
            # Check win
            if all(c in self.guessed for c in self.word):
                self.finished = True
                self.success = True
                self.score = 10 # 10 pts per word
        
        return self.get_state()

    def get_state(self):
        # Return masked word
        masked = "".join([c if c in self.guessed else "_" for c in self.word])
        # If lost, reveal word
        if self.finished and not self.success:
            masked = self.word
            
        return {
            "masked_word": masked,
            "word_length": len(self.word),
            "wrong_count": self.wrong_count,
            "max_errors": self.MAX_ERRORS,
            "guessed_letters": list(self.guessed),
            "finished": self.finished,
            "success": self.success,
            "score_gained": self.score if self.finished and self.success else 0,
            "index": self.word_index
        }

class MissionEngine:
    def __init__(self, slug, custom_scenario=None):
        self.slug = slug
        if custom_scenario:
            self.scenario = custom_scenario
        else:
            self.scenario = INTERACTIVE_SCENARIOS.get(slug, [])
        self.current_step_id = 'intro' if not custom_scenario else custom_scenario[0]['id']
        self.score = 0
        self.history = []
        self.finished = False
        
    def get_step_data(self):
        step = next((s for s in self.scenario if s['id'] == self.current_step_id), None)
        if not step:
            return None
            
        # Clone choices to avoid modifying global state, handle shuffling if needed
        choices = [c.copy() for c in step.get('choices', [])]
        
        # Shuffling Logic
        if step.get('shuffle', False):
            # Annotate with original index before shuffling
            for i, c in enumerate(choices):
                c['_original_index'] = i
            
            random.shuffle(choices)
            
            # Store mapping: displayed_index -> original_index
            self.choice_map = {i: c['_original_index'] for i, c in enumerate(choices)}
        else:
            self.choice_map = None

        return {
            'step_id': step['id'],
            'phase': step.get('phase', ''),
            'speaker': step.get('speaker', ''),
            'text': step.get('text', ''),
            'img': step.get('img'),
            'video': step.get('video'),
            'choices': [
                {'index': i, 'label': c['label'], 'type': c.get('type', 'default'), 'score': c.get('score', 0)}
                for i, c in enumerate(choices)
            ],
            'score': self.score,
            'is_game_over': step.get('is_game_over', False),
            'finished': step.get('finished', False),
            'minigame': True if 'minigame' in step.get('id', '') else False # simplified hint
        }

    def make_choice(self, choice_index=None, choice_label=None):
        if self.finished:
            return self.get_step_data()
            
        step = next((s for s in self.scenario if s['id'] == self.current_step_id), None)
        if not step:
            return None
            
        choices = step.get('choices', [])
        choice = None
        
        # 1. Try Label Lookup (Preferred - Stateless)
        if choice_label is not None:
            choice = next((c for c in choices if c['label'] == choice_label), None)
            
        # 2. Fallback to Index
        if not choice and choice_index is not None:
            # Resolve index if map exists
            real_index = choice_index
            if hasattr(self, 'choice_map') and self.choice_map:
                real_index = self.choice_map.get(choice_index, choice_index)

            if 0 <= real_index < len(choices):
                choice = choices[real_index]
        
        if choice:
            # Apply score
            self.score += choice.get('score', 0)
            if self.score < 0: self.score = 0
            
            # Progress
            next_id = choice.get('next')
            if next_id == 'FINISH':
                self.finished = True
                return {'finished': True, 'final_score': self.score}
            
            self.current_step_id = next_id
            self.history.append(self.current_step_id)
            
            # Check if new step is a finish step
            next_step = next((s for s in self.scenario if s['id'] == self.current_step_id), None)
            if next_step and next_step.get('finished'):
                self.finished = True
                
            return self.get_step_data()
            
        return self.get_step_data()

    def process_minigame_result(self, result_data):
        # Handle minigame outcome logic (e.g. from CPR game)
        # expects result_data to have 'success' boolean and maybe 'score_bonus'
        step = next((s for s in self.scenario if s['id'] == self.current_step_id), None)
        
        if not step:
            return
            
        success = result_data.get('success', False)
        bonus = result_data.get('score', 0)
        
        # Validate bonus? (simple cap)
        if bonus > 20: bonus = 20 # Cap per minigame
        
        self.score += bonus
        
        next_id = step.get('next_success') if success else step.get('next_fail')
        if not next_id:
             # Fallback
             next_id = step.get('choices', [])[0].get('next') if step.get('choices') else 'victory'

        self.current_step_id = next_id
        return self.get_step_data()
# Force reload timestamp
