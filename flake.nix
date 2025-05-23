{
  inputs = {
    # nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    systems,
    nixpkgs,
    treefmt-nix,
    ...
  } @ inputs: let
    eachSystem = f:
      nixpkgs.lib.genAttrs (import systems) (
        system:
          f {
            pkgs = import nixpkgs {
              inherit system;
              overlays = [];
            };
            inherit system;
          }
      );
    treefmtEval = eachSystem ({pkgs, ...}: treefmt-nix.lib.evalModule pkgs ./treefmt.nix);
  in {
    packages = eachSystem ({
      pkgs,
      system,
    }: let
      packageJson = nixpkgs.lib.importJSON ./package.json;
      app-src = pkgs.stdenv.mkDerivation {
        pname = packageJson.name;
        inherit (packageJson) version;
        src = ./.;

        nativeBuildInputs = [
          pkgs.nodejs
          pkgs.pnpm.configHook
          pkgs.typescript
        ];

        buildPhase = ''
          runHook preBuild
          pnpm --offline build
          runHook postBuild
        '';

        installPhase = ''
          mkdir -p ''$out
          cp -r ./build/* ''$out
        '';

        pnpmDeps = pkgs.pnpm.fetchDeps {
          inherit (self.packages.${system}.app-src) pname version src;
          hash = "sha256-r4x0EJ3MMe5krrinlj32oGlrFT/vXeQJhBVzsrlKRSA=";
        };
      };
    in rec {
      inherit app-src;
      default = pkgs.writeShellApplication {
        inherit (packageJson) name;
        runtimeInputs = [app-src pkgs.nodejs];
        text = ''
          ${pkgs.nodejs}/bin/node ${app-src}/index.js
        '';
      };
      docker = pkgs.dockerTools.buildLayeredImage {
        inherit (packageJson) name;
        tag = packageJson.version;
        contents = [pkgs.nodejs default];
        config = {
          Entrypoint = ["${pkgs.dumb-init}/bin/dumb-init" "--"];
          Cmd = ["${default}/bin/${packageJson.name}"];
          ExposedPorts = {"3000/tcp" = {};};
        };
      };
    });
    devShells = eachSystem ({pkgs, ...}: {
      default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          clang
          # Use mold when we are runnning in Linux
          (lib.optionals stdenv.isLinux mold)
        ];
        buildInputs = with pkgs; [
          nodejs
          corepack

          nodePackages.typescript
          nodePackages.typescript-language-server
          svelte-language-server
          tailwindcss-language-server

          prettierd
        ];
      };
    });
    formatter = eachSystem ({pkgs, ...}: treefmtEval.${pkgs.system}.config.build.wrapper);

    checks = eachSystem ({pkgs, ...}: {
      formatting = treefmtEval.${pkgs.system}.config.build.check self;
    });
  };
}
