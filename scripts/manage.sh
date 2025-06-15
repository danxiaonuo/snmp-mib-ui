#!/bin/bash

# SNMP MIB Platform 脚本管理工具
# 作者: Evan (oumu743@gmail.com)
# 版本: 1.0.0
# 用途: 统一管理和执行项目中的各种脚本

set -euo pipefail
IFS=$'\n\t'

# 脚本信息
readonly SCRIPT_NAME="SNMP MIB Platform 脚本管理工具"
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_DESCRIPTION="统一管理和执行项目中的各种脚本"

# 导入公共函数库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/lib/common.sh" ]]; then
    source "$SCRIPT_DIR/lib/common.sh"
else
    echo "错误: 无法找到公共函数库 lib/common.sh"
    exit 1
fi

# 初始化公共函数库
init_common_lib

# 项目根目录
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ============================================================================
# 脚本发现和管理
# ============================================================================

# 发现所有可执行脚本
discover_scripts() {
    log_step "发现项目脚本..."
    
    local scripts=()
    
    # 在项目根目录查找脚本
    while IFS= read -r -d '' script; do
        if [[ -x "$script" && "$script" != *"/manage.sh" ]]; then
            scripts+=("$script")
        fi
    done < <(find "$PROJECT_ROOT" -name "*.sh" -type f -print0 2>/dev/null)
    
    # 输出发现的脚本
    if [[ ${#scripts[@]} -eq 0 ]]; then
        log_warning "未发现可执行脚本"
        return 1
    fi
    
    log_success "发现 ${#scripts[@]} 个脚本"
    printf '%s\n' "${scripts[@]}"
}

# 显示脚本列表
show_scripts() {
    log_title "可用脚本列表"
    
    local scripts
    mapfile -t scripts < <(discover_scripts 2>/dev/null || true)
    
    if [[ ${#scripts[@]} -eq 0 ]]; then
        log_warning "未发现可执行脚本"
        return 1
    fi
    
    echo -e "${CYAN}序号  脚本名称                    描述${NC}"
    echo -e "${CYAN}----  ------------------------  --------------------------------${NC}"
    
    local index=1
    for script in "${scripts[@]}"; do
        local script_name=$(basename "$script")
        local script_path=$(realpath --relative-to="$PROJECT_ROOT" "$script")
        local description=$(get_script_description "$script")
        
        printf "${YELLOW}%2d${NC}    ${GREEN}%-24s${NC}  %s\n" \
            "$index" "$script_name" "$description"
        
        if [[ "$VERBOSE" == "true" ]]; then
            printf "      ${CYAN}路径:${NC} %s\n" "$script_path"
        fi
        
        ((index++))
    done
    
    echo
    log_info "使用 '$0 run <脚本名称>' 执行脚本"
    log_info "使用 '$0 info <脚本名称>' 查看脚本详情"
}

# 获取脚本描述
get_script_description() {
    local script="$1"
    local description=""
    
    # 尝试从脚本注释中提取描述
    if [[ -f "$script" ]]; then
        # 查找包含描述的注释行
        description=$(grep -E "^#.*[描述|Description|用途|Purpose]" "$script" | head -1 | sed 's/^#[[:space:]]*//' | cut -d':' -f2- | sed 's/^[[:space:]]*//' 2>/dev/null || true)
        
        # 如果没有找到，尝试其他模式
        if [[ -z "$description" ]]; then
            description=$(grep -E "^#.*脚本" "$script" | head -1 | sed 's/^#[[:space:]]*//' 2>/dev/null || true)
        fi
        
        # 尝试获取第二行注释作为描述
        if [[ -z "$description" ]]; then
            description=$(sed -n '2p' "$script" | grep "^#" | sed 's/^#[[:space:]]*//' 2>/dev/null || true)
        fi
        
        # 如果还是没有，使用默认描述
        if [[ -z "$description" ]]; then
            case "$(basename "$script")" in
                deploy-china*.sh)
                    description="中国大陆部署脚本"
                    ;;
                test*.sh)
                    description="测试脚本"
                    ;;
                verify*.sh)
                    description="验证脚本"
                    ;;
                prepare*.sh)
                    description="准备脚本"
                    ;;
                install*.sh)
                    description="安装脚本"
                    ;;
                *)
                    description="Shell 脚本"
                    ;;
            esac
        fi
    fi
    
    echo "$description"
}

# 显示脚本详细信息
show_script_info() {
    local script_name="$1"
    local script_path=$(find_script "$script_name")
    
    if [[ -z "$script_path" ]]; then
        log_error "脚本不存在: $script_name"
        return 1
    fi
    
    log_title "脚本信息: $(basename "$script_path")"
    
    echo -e "${CYAN}基本信息:${NC}"
    echo -e "  脚本名称: ${GREEN}$(basename "$script_path")${NC}"
    echo -e "  完整路径: ${YELLOW}$script_path${NC}"
    echo -e "  相对路径: ${BLUE}$(realpath --relative-to="$PROJECT_ROOT" "$script_path")${NC}"
    echo -e "  文件大小: $(du -h "$script_path" | cut -f1)"
    echo -e "  修改时间: $(stat -c %y "$script_path" | cut -d'.' -f1)"
    echo -e "  权限: $(stat -c %A "$script_path")"
    echo
    
    # 提取脚本元信息
    local version=$(grep -E "^#.*[版本|Version]" "$script_path" | head -1 | sed 's/^#[[:space:]]*//' | cut -d':' -f2- | sed 's/^[[:space:]]*//' || echo "未知")
    local author=$(grep -E "^#.*[作者|Author]" "$script_path" | head -1 | sed 's/^#[[:space:]]*//' | cut -d':' -f2- | sed 's/^[[:space:]]*//' || echo "未知")
    local description=$(get_script_description "$script_path")
    
    echo -e "${CYAN}脚本元信息:${NC}"
    echo -e "  版本: $version"
    echo -e "  作者: $author"
    echo -e "  描述: $description"
    echo
    
    # 检查依赖
    echo -e "${CYAN}依赖检查:${NC}"
    local dependencies=$(grep -E "^[[:space:]]*check_command|command -v" "$script_path" | grep -o '"[^"]*"' | tr -d '"' | sort -u || true)
    if [[ -n "$dependencies" ]]; then
        while IFS= read -r dep; do
            if command -v "$dep" &> /dev/null; then
                echo -e "  ${GREEN}✓${NC} $dep"
            else
                echo -e "  ${RED}✗${NC} $dep (未安装)"
            fi
        done <<< "$dependencies"
    else
        echo -e "  ${YELLOW}未检测到明确的依赖${NC}"
    fi
    echo
    
    # 显示帮助信息（如果支持）
    if grep -q "\-\-help\|\-h" "$script_path"; then
        echo -e "${CYAN}帮助信息:${NC}"
        echo -e "  支持 --help 参数，运行 '$script_name --help' 查看详细帮助"
        echo
    fi
    
    # 显示脚本头部注释
    echo -e "${CYAN}脚本说明:${NC}"
    local header_comments=$(head -20 "$script_path" | grep "^#" | grep -v "^#!/" | sed 's/^#[[:space:]]*/  /' || true)
    if [[ -n "$header_comments" ]]; then
        echo "$header_comments"
    else
        echo -e "  ${YELLOW}无详细说明${NC}"
    fi
}

# 查找脚本
find_script() {
    local script_name="$1"
    local scripts
    mapfile -t scripts < <(discover_scripts 2>/dev/null || true)
    
    # 精确匹配
    for script in "${scripts[@]}"; do
        if [[ "$(basename "$script")" == "$script_name" ]]; then
            echo "$script"
            return 0
        fi
    done
    
    # 模糊匹配
    for script in "${scripts[@]}"; do
        if [[ "$(basename "$script")" == *"$script_name"* ]]; then
            echo "$script"
            return 0
        fi
    done
    
    return 1
}

# ============================================================================
# 脚本执行
# ============================================================================

# 执行脚本
run_script() {
    local script_name="$1"
    shift
    
    local script_path=$(find_script "$script_name")
    
    if [[ -z "$script_path" ]]; then
        log_error "脚本不存在: $script_name"
        log_info "使用 '$0 list' 查看可用脚本"
        return 1
    fi
    
    if [[ ! -x "$script_path" ]]; then
        log_error "脚本不可执行: $script_path"
        log_info "请检查脚本权限: chmod +x $script_path"
        return 1
    fi
    
    log_info "执行脚本: $(basename "$script_path")"
    log_debug "脚本路径: $script_path"
    log_debug "参数: $*"
    
    # 切换到脚本所在目录
    local script_dir=$(dirname "$script_path")
    local original_dir=$(pwd)
    
    cd "$script_dir"
    
    # 执行脚本
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "试运行模式: 将执行 $script_path $*"
    else
        log_step "开始执行脚本..."
        "$script_path" "$@"
        local exit_code=$?
        
        if [[ $exit_code -eq 0 ]]; then
            log_success "脚本执行完成"
        else
            log_error "脚本执行失败，退出码: $exit_code"
        fi
        
        cd "$original_dir"
        return $exit_code
    fi
    
    cd "$original_dir"
}

# 批量执行脚本
run_multiple_scripts() {
    local scripts=("$@")
    local total=${#scripts[@]}
    local success=0
    local failed=0
    
    log_title "批量执行脚本"
    log_info "将执行 $total 个脚本"
    
    for i in "${!scripts[@]}"; do
        local script="${scripts[$i]}"
        local current=$((i + 1))
        
        log_step "执行脚本 $current/$total: $script"
        
        if run_script "$script"; then
            ((success++))
            log_success "脚本 $script 执行成功"
        else
            ((failed++))
            log_error "脚本 $script 执行失败"
            
            if ! ask_confirmation "是否继续执行剩余脚本？"; then
                break
            fi
        fi
        
        echo
    done
    
    log_info "批量执行结果: 成功 $success, 失败 $failed"
}

# ============================================================================
# 脚本管理功能
# ============================================================================

# 验证所有脚本
validate_scripts() {
    log_step "验证所有脚本..."
    
    local scripts
    mapfile -t scripts < <(discover_scripts 2>/dev/null || true)
    
    local total=${#scripts[@]}
    local valid=0
    local invalid=0
    
    for script in "${scripts[@]}"; do
        log_info "验证脚本: $(basename "$script")"
        
        # 检查语法
        if bash -n "$script" 2>/dev/null; then
            log_success "语法检查通过: $(basename "$script")"
            ((valid++))
        else
            log_error "语法错误: $(basename "$script")"
            ((invalid++))
        fi
    done
    
    log_info "验证结果: 有效 $valid, 无效 $invalid"
    
    if [[ $invalid -gt 0 ]]; then
        return 1
    fi
}

# 更新脚本权限
fix_permissions() {
    log_step "修复脚本权限..."
    
    local scripts
    mapfile -t scripts < <(find "$PROJECT_ROOT" -name "*.sh" -type f 2>/dev/null || true)
    
    local fixed=0
    
    for script in "${scripts[@]}"; do
        if [[ ! -x "$script" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "试运行: 将修复权限 $script"
            else
                chmod +x "$script"
                log_success "权限已修复: $(basename "$script")"
            fi
            ((fixed++))
        fi
    done
    
    if [[ $fixed -eq 0 ]]; then
        log_success "所有脚本权限正常"
    else
        log_success "修复了 $fixed 个脚本的权限"
    fi
}

# ============================================================================
# 帮助和主函数
# ============================================================================

# 显示帮助信息
show_help() {
    show_script_info "$SCRIPT_NAME" "$SCRIPT_VERSION" "$SCRIPT_DESCRIPTION"
    
    cat << EOF
用法: $0 <命令> [选项] [参数...]

命令:
  list, ls                列出所有可用脚本
  info <脚本名称>         显示脚本详细信息
  run <脚本名称> [参数]   执行指定脚本
  batch <脚本1> <脚本2>   批量执行多个脚本
  validate                验证所有脚本语法
  fix-permissions         修复脚本权限
  help                    显示此帮助信息

选项:
  -v, --verbose           详细输出模式
  -n, --dry-run           试运行模式
  -f, --force             强制模式

示例:
  $0 list                           # 列出所有脚本
  $0 info deploy-china.sh           # 查看部署脚本信息
  $0 run deploy-china.sh --help     # 执行部署脚本并显示帮助
  $0 run test_platform.sh           # 执行平台测试
  $0 batch test*.sh                 # 批量执行所有测试脚本
  $0 validate                       # 验证所有脚本
  $0 fix-permissions                # 修复脚本权限

EOF
    
    show_standard_help "$(basename "$0")"
}

# 解析命令行参数
parse_arguments() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    # 解析全局选项
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    # 解析命令
    local command="${1:-help}"
    shift || true
    
    case "$command" in
        list|ls)
            show_scripts
            ;;
        info)
            if [[ $# -eq 0 ]]; then
                log_error "请指定脚本名称"
                exit 1
            fi
            show_script_info "$1"
            ;;
        run)
            if [[ $# -eq 0 ]]; then
                log_error "请指定脚本名称"
                exit 1
            fi
            run_script "$@"
            ;;
        batch)
            if [[ $# -eq 0 ]]; then
                log_error "请指定至少一个脚本名称"
                exit 1
            fi
            run_multiple_scripts "$@"
            ;;
        validate)
            validate_scripts
            ;;
        fix-permissions)
            fix_permissions
            ;;
        help)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 主函数
main() {
    # 显示脚本信息
    if [[ "${1:-}" != "list" && "${1:-}" != "ls" ]]; then
        show_script_info "$SCRIPT_NAME" "$SCRIPT_VERSION" "$SCRIPT_DESCRIPTION"
    fi
    
    # 解析参数并执行命令
    parse_arguments "$@"
}

# 执行主函数
main "$@"